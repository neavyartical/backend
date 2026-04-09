const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// SIMPLE MEMORY USERS
let users = {};

// REGISTER
app.post("/register", (req,res)=>{
  const {username,password} = req.body;

  if(users[username]){
    return res.json({success:false,message:"User exists"});
  }

  users[username] = {password, premium:false};
  res.json({success:true});
});

// LOGIN
app.post("/login",(req,res)=>{
  const {username,password} = req.body;

  if(users[username] && users[username].password === password){
    return res.json({success:true,premium:users[username].premium});
  }

  res.json({success:false});
});

// GENERATE (FREE MODE WORKING)
app.post("/generate",(req,res)=>{
  const {prompt,type} = req.body;

  if(!prompt){
    return res.json({result:"No prompt"});
  }

  // TEXT
  if(type === "chat" || type === "story"){
    return res.json({
      result: "AI says: " + prompt + " 🚀"
    });
  }

  // IMAGE (FREE API)
  if(type === "image"){
    return res.json({
      result: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    });
  }

  // VIDEO (FREE DEMO)
  if(type === "video"){
    return res.json({
      result: "⚠️ Free video demo. Upgrade for real video AI (Runway/Pika)"
    });
  }

  res.json({result:"Unsupported type"});
});

// PAYPAL VERIFY (SIMULATED FOR NOW)
app.post("/verify",(req,res)=>{
  const {username} = req.body;

  if(users[username]){
    users[username].premium = true;
    return res.json({success:true});
  }

  res.json({success:false});
});

app.listen(PORT,()=>console.log("Server running on",PORT));
