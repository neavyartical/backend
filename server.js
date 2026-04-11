import express from "express";
import cors from "cors";

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("🔥 ReelMind Backend Live");
});

/* ================= AI STORY (OPENROUTER) ================= */
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
            content: "You are a cinematic AI that creates viral, emotional, high-quality stories."
          },
          {
            role: "user",
            content: `Create a short viral cinematic story about: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();

    const story = data.choices?.[0]?.message?.content;

    res.json({
      success: true,
      story: story || "No story generated"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

/* ================= START SERVER ================= */
app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 Server running...");
});
