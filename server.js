import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 OPTIONAL (leave empty if no money yet)
const OPENAI_KEY = "";

// USERS (memory for now)
let users = {};

// LOGIN
app.post("/login", (req,res)=>{
  const {username,password} = req.body;

  if(!users[username]){
    users[username]={password,premium:false};
  }

  if(users[username].password===password){
    res.json({success:true,premium:users[username].premium});
  } else {
    res.json({success:false});
  }
});

// PAYPAL VERIFY (simple)
app.post("/verify-payment",(req,res)=>{
  const {username} = req.body;

  if(users[username]){
    users[username].premium=true;
    return res.json({success:true});
  }

  res.json({success:false});
});

// GENERATE
app.post("/generate", async (req,res)=>{
  const {prompt,type} = req.body;

  // IMAGE (FREE)
  if(type==="image"){
    return res.json({
      result:`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    });
  }

  // TRY REAL AI
  try{
    if(OPENAI_KEY){
      const response = await fetch("https://api.openai.com/v1/chat/completions",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":"Bearer "+OPENAI_KEY
        },
        body:JSON.stringify({
          model:"gpt-4o-mini",
          messages:[{role:"user",content:prompt}]
        })
      });

      const data = await response.json();

      return res.json({
        result:data.choices?.[0]?.message?.content || "No response"
      });
    }
  }catch(e){}

  // FREE FALLBACK
  res.json({
    result:"🤖 "+prompt+" is a powerful idea!"
  });
});

app.listen(3000,()=>console.log("Server running"));
