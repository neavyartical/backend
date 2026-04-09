import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// 🔐 USERS (simple memory for now)
let users = {};

// 💡 DAILY LIMIT (protect cost)
const FREE_LIMIT = 3;

// 🟢 REGISTER
app.post("/register", (req,res)=>{
  const {username,password} = req.body;

  if(!username || !password){
    return res.json({success:false});
  }

  if(!users[username]){
    users[username] = {
      password,
      premium:false,
      usage:0
    };
  }

  res.json({success:true});
});

// 🔵 LOGIN
app.post("/login",(req,res)=>{
  const {username,password} = req.body;

  if(users[username] && users[username].password === password){
    return res.json({
      success:true,
      premium:users[username].premium
    });
  }

  res.json({success:false});
});

// 💰 UPGRADE (simulate payment)
app.post("/upgrade",(req,res)=>{
  const {username} = req.body;

  if(users[username]){
    users[username].premium = true;
    return res.json({success:true});
  }

  res.json({success:false});
});

// 🤖 GENERATE
app.post("/generate", async (req,res)=>{
  const {prompt,type,username} = req.body;

  if(!prompt){
    return res.json({result:"Enter prompt"});
  }

  let user = users[username];

  // 🛑 if not logged
  if(!user){
    return res.json({result:"Login first"});
  }

  // 💸 FREE LIMIT CONTROL
  if(!user.premium && user.usage >= FREE_LIMIT){
    return res.json({
      result:"🚫 Free limit reached. Upgrade to Premium ($9)"
    });
  }

  try{

    // 🧠 TEXT (CHEAP OpenAI)
    if(type === "chat" || type === "story"){
      if(user.premium){

        // 🔥 USE OPENAI ONLY FOR PREMIUM
        const response = await fetch("https://api.openai.com/v1/chat/completions",{
          method:"POST",
          headers:{
            "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            model:"gpt-4o-mini",
            messages:[{role:"user",content:prompt}],
            max_tokens:100
          })
        });

        const data = await response.json();

        user.usage++;

        return res.json({
          result:data.choices?.[0]?.message?.content || "Error"
        });

      }else{
        // 🆓 FREE MODE (NO COST)
        user.usage++;
        return res.json({
          result:"🔥 AI says: " + prompt
        });
      }
    }

    // 🖼 IMAGE (FREE API)
    if(type === "image"){
      user.usage++;
      return res.json({
        result:`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      });
    }

    // 🎬 VIDEO (FREE TEMP)
    if(type === "video"){
      user.usage++;
      return res.json({
        result:`https://pollinations.ai/video?prompt=${encodeURIComponent(prompt)}`
      });
    }

    res.json({result:"Invalid type"});

  }catch(err){
    console.log(err);
    res.json({result:"Server error"});
  }
});

// 🚀 START SERVER
app.listen(PORT,()=>{
  console.log("Server running on port "+PORT);
});
