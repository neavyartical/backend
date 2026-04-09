import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENAI_API_KEY;

app.get("/", (req,res)=>{
  res.send("Backend running 🚀");
});

app.post("/generate", async (req, res) => {
  try {
    const { type, prompt } = req.body;

    let fullPrompt = prompt;

    if(type === "story") fullPrompt = "Write a long story about " + prompt;
    if(type === "funny") fullPrompt = "Make this funny: " + prompt;
    if(type === "sad") fullPrompt = "Make this emotional: " + prompt;
    if(type === "anime") fullPrompt = "Anime style scene: " + prompt;
    if(type === "money") fullPrompt = "How to make money from: " + prompt;
    if(type === "tiktok") fullPrompt = "Create viral TikTok idea: " + prompt;
    if(type === "video") fullPrompt = "Describe a cinematic video: " + prompt;
    if(type === "image") fullPrompt = "Describe an image: " + prompt;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: fullPrompt
      })
    });

    const data = await response.json();

    res.json({
      result: data.output?.[0]?.content?.[0]?.text || "No response"
    });

  } catch (err) {
    res.json({ result: "Error: " + err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log("Server running"));
