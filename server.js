import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ✅ Health check
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running ✅");
});

// ✅ STORY (OpenRouter GPT)
app.post("/api/story", async (req, res) => {
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
          { role: "user", content: `Create a viral cinematic story: ${prompt}` }
        ]
      })
    });

    const data = await response.json();

    res.json({
      story: data.choices?.[0]?.message?.content || "Story failed"
    });

  } catch (error) {
    res.status(500).json({ error: "Story error" });
  }
});

// ✅ IMAGE (FREE WORKING VERSION)
app.post("/api/image", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    image: `https://source.unsplash.com/800x600/?${encodeURIComponent(prompt)}`
  });
});

// ✅ VIDEO (Runway or fallback)
app.post("/api/video", async (req, res) => {
  try {
    const { prompt } = req.body;

    // ⚠️ If no API → demo fallback
    if (!process.env.RUNWAY_API_KEY) {
      return res.json({
        video: "https://www.w3schools.com/html/mov_bbb.mp4"
      });
    }

    const response = await fetch("https://api.runwayml.com/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        model: "gen4"
      })
    });

    const data = await response.json();

    res.json({
      video: data.output?.video_url || "Video failed"
    });

  } catch (err) {
    res.status(500).json({ error: "Video error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
