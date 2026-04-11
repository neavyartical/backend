import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());

/* ===== ROOT ===== */
app.get("/", (req, res) => {
  res.send("🔥 ReelMind Backend Live");
});

/* ===== AI STORY ===== */
app.post("/story", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_OPENROUTER_API_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You create ultra cinematic, viral, emotional stories."
          },
          {
            role: "user",
            content: `Create a cinematic viral story about: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices) {
      return res.json({ story: "⚠️ AI not responding yet" });
    }

    res.json({
      story: data.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({ story: "❌ AI error" });
  }
});

/* ===== START SERVER ===== */
app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 Server running...");
});
