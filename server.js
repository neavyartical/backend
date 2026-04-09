import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENAI_API_KEY;

app.post("/generate", async (req, res) => {
  try {
    const { type, prompt } = req.body;

    let fullPrompt = "";

    if(type === "story"){
      fullPrompt = "Write a long emotional story about " + prompt;
    } else if(type === "funny"){
      fullPrompt = "Make this funny: " + prompt;
    } else if(type === "sad"){
      fullPrompt = "Make this sad: " + prompt;
    } else if(type === "anime"){
      fullPrompt = "Anime style scene: " + prompt;
    } else if(type === "money"){
      fullPrompt = "How to make money from: " + prompt;
    } else if(type === "tiktok"){
      fullPrompt = "Create viral TikTok idea: " + prompt;
    } else if(type === "video"){
      fullPrompt = "Describe a cinematic video scene: " + prompt;
    } else if(type === "image"){
      fullPrompt = "Describe an image: " + prompt;
    } else {
      fullPrompt = prompt;
    }

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
      result: data.output[0].content[0].text
    });

  } catch (err) {
    res.json({ result: "Error: " + err.message });
  }
});

app.get("/", (req,res)=>{
  res.send("Backend running 🚀");
});

app.listen(10000, ()=> console.log("Server running"));
