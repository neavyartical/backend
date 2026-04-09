import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 PUT YOUR OPENAI KEY HERE
const OPENAI_KEY = "YOUR_OPENAI_API_KEY";

// AI ROUTE
app.post("/generate", async (req,res)=>{
  const {prompt} = req.body;

  try{
    // REAL AI CALL
    const response = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer " + OPENAI_KEY
      },
      body:JSON.stringify({
        model:"gpt-4o-mini",
        messages:[{role:"user",content:prompt}],
        max_tokens:100
      })
    });

    const data = await response.json();

    res.json({
      result: data.choices?.[0]?.message?.content || "No response"
    });

  }catch(e){
    // FALLBACK (FREE)
    res.json({
      result:"🤖 (offline AI): " + prompt + " is a powerful idea!"
    });
  }
});

app.listen(3000, ()=>console.log("AI server running"));
