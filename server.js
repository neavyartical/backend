import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 YOUR API KEY FROM RENDER ENV
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🔥 HEALTH CHECK (so “cannot GET” disappears)
app.get("/", (req, res) => {
  res.send("ReelMind Backend is Running 🚀");
});

// 🧠 STORY GENERATION (ChatGPT brain via OpenRouter)
app.post("/generate-story", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing API key in server" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "user", content: `Write a viral cinematic story about: ${prompt}` }
        ]
      })
    });

    const data = await response.json();

    res.json({
      story: data.choices?.[0]?.message?.content || "No story generated"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🎬 VIDEO (Runway placeholder — real integration later)
app.post("/generate-video", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    video: "https://cdn.coverr.co/videos/coverr-dog-running-1578/1080p.mp4"
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running 🚀"));
