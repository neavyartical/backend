import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ROOT CHECK */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* GENERATE (STORY + IMAGE + VIDEO) */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    /* ---------- STORY (OpenRouter) ---------- */
    let story = `🔥 Cinematic story for: ${prompt}`;

    if (process.env.OPENROUTER_API_KEY) {
      const storyRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

      const storyData = await storyRes.json();
      story = storyData.choices?.[0]?.message?.content || story;
    }

    /* ---------- IMAGE (SAFE PLACEHOLDER / HF LATER) ---------- */
    const image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;

    /* ---------- VIDEO (RUNWAY READY) ---------- */
    let video = "";

    if (process.env.RUNWAY_API_KEY) {
      // ⚠️ REAL Runway integration will go here after payment
      // For now we keep it safe (no demo loop, no crash)
      video = "";
    }

    /* ---------- FINAL RESPONSE (THIS IS YOUR JSON FIX) ---------- */
    res.json({
      story,
      image,
      video
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      story: "❌ Generation failed",
      image: "",
      video: ""
    });
  }
});

/* ASK ANYTHING (GOOGLE-LIKE AI) */
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    let answer = `🌍 Answer: ${question}`;

    if (process.env.OPENROUTER_API_KEY) {
      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
              content: question
            }
          ]
        })
      });

      const aiData = await aiRes.json();
      answer = aiData.choices?.[0]?.message?.content || answer;
    }

    res.json({ answer });

  } catch (error) {
    res.status(500).json({
      answer: "❌ AI not responding"
    });
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
