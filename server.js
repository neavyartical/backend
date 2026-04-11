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

/* GENERATE EVERYTHING */
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    /* ---------- STORY ---------- */
    let story = `🔥 Cinematic story for: ${prompt}`;

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "user", content: `Write a cinematic viral story: ${prompt}` }
          ]
        })
      });

      const data = await response.json();
      story = data.choices?.[0]?.message?.content || story;
    }

    /* ---------- IMAGE ---------- */
    const image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;

    /* ---------- VIDEO ---------- */
    let video = "";

    if (process.env.RUNWAY_API_KEY) {
      // Future real Runway integration
      video = "";
    }

    /* ---------- FINAL JSON ---------- */
    res.json({
      story,
      image,
      video
    });

  } catch (error) {
    console.error("Generate error:", error);

    res.status(500).json({
      story: "❌ Generation failed",
      image: "",
      video: ""
    });
  }
});

/* ASK ANYTHING */
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    let answer = `🌍 ${question}`;

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: question }]
        })
      });

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || answer;
    }

    res.json({ answer });

  } catch (error) {
    res.status(500).json({ answer: "❌ AI not responding" });
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
