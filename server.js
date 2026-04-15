require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ===== MEMORY DB =====
let user = { credits: 10 };
let stats = { users: 1, requests: 0 };

// ===== USER =====
app.get("/user",(req,res)=>{
  res.json(user);
});

// ===== TEXT =====
app.post("/generate-text", async (req,res)=>{

  const { prompt } = req.body;

  if(user.credits <= 0){
    return res.json({ error:"No credits" });
  }

  user.credits--;
  stats.requests++;

  try{
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"openai/gpt-4o-mini",
        messages:[{role:"user",content:prompt}]
      })
    });

    const data = await r.json();

    res.json({
      output: data.choices?.[0]?.message?.content || "Done",
      credits: user.credits
    });

  }catch(e){
    res.json({ error:"AI error" });
  }
});

// ===== IMAGE =====
app.post("/generate-image",(req,res)=>{

  const { prompt } = req.body;

  if(user.credits <= 0){
    return res.json({ error:"No credits" });
  }

  user.credits--;
  stats.requests++;

  res.json({
    output:`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`,
    credits:user.credits
  });
});

// ===== ADMIN =====
app.get("/admin",(req,res)=>{
  res.json(stats);
});

// ===== HEALTH =====
app.get("/",(req,res)=>{
  res.send("🚀 Backend LIVE");
});

app.listen(3000,()=>console.log("🔥 Server running"));
