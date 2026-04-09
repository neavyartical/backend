import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
  res.send("Backend running 🚀");
});

app.post("/generate", async (req, res) => {
  try {
    const { type, prompt } = req.body;

    let result = "";

    if(type === "story") result = "📖 Story: " + prompt + "... (AI story here)";
    else if(type === "funny") result = "😂 Funny: " + prompt;
    else if(type === "sad") result = "💔 Sad: " + prompt;
    else if(type === "anime") result = "🔥 Anime: " + prompt;
    else if(type === "money") result = "💰 Money idea: " + prompt;
    else if(type === "tiktok") result = "🚀 TikTok idea: " + prompt;
    else if(type === "video") result = "🎬 Video idea: " + prompt;
    else if(type === "image") result = "🖼 Image description: " + prompt;
    else result = "💬 Chat: " + prompt;

    // simulate response delay
    setTimeout(() => {
      res.json({ result });
    }, 1000);

  } catch (err) {
    res.json({ result: "Error: " + err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log("Server running"));
