import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// USERS (simple memory for now)
let users = {};

// LOGIN
app.post("/login", (req,res)=>{
  const {username,password} = req.body;

  if(!users[username]){
    users[username] = { password, premium:false };
  }

  if(users[username].password === password){
    res.json({ success:true, premium:users[username].premium });
  } else {
    res.json({ success:false });
  }
});

// VERIFY PAYMENT (SIMULATED)
app.post("/verify", (req,res)=>{
  const {username} = req.body;

  if(users[username]){
    users[username].premium = true;
    return res.json({ success:true });
  }

  res.json({ success:false });
});

// GENERATE
app.post("/generate",(req,res)=>{
  const {prompt,type} = req.body;

  if(type==="image"){
    return res.json({
      result:`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    });
  }

  if(type==="story"){
    return res.json({
      result:`📖 Story:\n${prompt}...\nAn amazing story unfolds.`
    });
  }

  if(type==="music"){
    return res.json({
      result:"🎵 Music system coming soon (premium feature)"
    });
  }

  res.json({
    result:"🤖 AI: " + prompt
  });
});

app.listen(3000, ()=>console.log("Server running"));
