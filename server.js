import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// FREE TEXT GENERATOR (FAKE AI BUT SMART)
function generateText(prompt, type){
  if(type === "story"){
    return "📖 Story: " + prompt + "...\nA powerful story unfolds with emotions and creativity.";
  }

  if(type === "funny"){
    return "😂 Funny: " + prompt + " turned into something hilarious!";
  }

  if(type === "money"){
    return "💰 Idea: " + prompt + " can be monetized using social media + AI tools.";
  }

  return "🤖 AI Response: " + prompt;
}

// ROUTE
app.post("/generate", (req,res)=>{
  const {prompt, type} = req.body;

  if(type === "image"){
    return res.json({
      result: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    });
  }

  if(type === "video"){
    return res.json({
      result: "🎬 Free video preview mode. Upgrade for real AI video."
    });
  }

  res.json({
    result: generateText(prompt, type)
  });
});

app.listen(3000, ()=> console.log("Server running"));
