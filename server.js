import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ HEALTH CHECK (IMPORTANT)
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

// 🔥 STORY (OpenRouter GPT)
app.post("/story", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Write a cinematic viral story: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();
    res.json({ story: data.choices[0].message.content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Story failed" });
  }
});

// 🔥 IMAGE (Free working fallback)
app.post("/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024`;

    res.json({ image: imageUrl });

  } catch (err) {
    res.status(500).json({ error: "Image failed" });
  }
});

// 🔥 REAL RUNWAY VIDEO
app.post("/video", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.runwayml.com/v1/generate/video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "gen4_turbo",
        duration: 5
      })
    });

    const data = await response.json();

    res.json({
      video: data?.video_url || null,
      status: data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Video failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
