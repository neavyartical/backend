import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ================= TEXT ================= */
app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    res.json(data);

  } catch {
    res.json({ error: "Text generation failed" });
  }
});

/* ================= VIDEO START ================= */
app.post("/generate-video", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.runwayml.com/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: 5
      })
    });

    const data = await response.json();
    res.json(data);

  } catch {
    res.json({ error: "Video generation failed" });
  }
});

/* ================= VIDEO STATUS ================= */
app.get("/video-status/:id", async (req, res) => {
  try {
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${req.params.id}`, {
      headers: {
        "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`
      }
    });

    const data = await response.json();

    res.json({
      video_url: data.output?.video || null
    });

  } catch {
    res.json({ error: "Status check failed" });
  }
});

app.listen(10000, () => console.log("🚀 Server running"));
