import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* GENERATE */
app.post("/generate", async (req, res) => {
  const { prompt, type } = req.body;

  try {
    let story = "";
    let image = "";
    let video = "";

    /* ---------- STORY ---------- */
    if (type === "story" || type === "all") {
      story = `🔥 Cinematic story for: ${prompt}`;

      if (process.env.OPENROUTER_API_KEY) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              { role: "user", content: `Write a cinematic viral story: ${prompt}` }
            ],
          }),
        });

        const data = await response.json();
        story = data.choices?.[0]?.message?.content || story;
      }
    }

    /* ---------- IMAGE ---------- */
    if (type === "image" || type === "all") {
      image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;
    }

    /* ---------- VIDEO ---------- */
    if (type === "video" || type === "all") {
      video = ""; // future runway
    }

    res.json({ story, image, video });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      story: "❌ Failed",
      image: "",
      video: "",
    });
  }
});

/* ASK AI */
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    let answer = `🌍 ${question}`;

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: question }],
        }),
      });

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || answer;
    }

    res.json({ answer });

  } catch {
    res.status(500).json({ answer: "❌ AI error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
