import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ROOT CHECK */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* ============================= */
/* 🔥 GENERATE EVERYTHING */
/* ============================= */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    let story = "";
    let image = "";
    let video = "";

    /* STORY */
    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
      story = data.choices?.[0]?.message?.content || "No story generated";
    }

    /* IMAGE */
    image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;

    /* VIDEO (SAFE UNTIL RUNWAY ACTIVE) */
    video = "";

    res.json({ story, image, video });

  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({
      story: "❌ Failed",
      image: "",
      video: ""
    });
  }
});

/* ============================= */
/* 📖 STORY ONLY */
/* ============================= */
app.post("/generate-story", async (req, res) => {
  const { prompt } = req.body;

  try {
    let story = "No API key";

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      story = data.choices?.[0]?.message?.content || story;
    }

    res.json({ story });

  } catch (err) {
    res.status(500).json({ story: "❌ Error" });
  }
});

/* ============================= */
/* 🖼 IMAGE ONLY */
/* ============================= */
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    const image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;
    res.json({ image });
  } catch (err) {
    res.status(500).json({ image: "" });
  }
});

/* ============================= */
/* 🎬 VIDEO ONLY */
/* ============================= */
app.post("/generate-video", async (req, res) => {
  const { prompt } = req.body;

  try {
    let video = "";

    if (process.env.RUNWAY_API_KEY) {
      // Future Runway integration here
      video = "";
    }

    res.json({ video });

  } catch (err) {
    res.status(500).json({ video: "" });
  }
});

/* ============================= */
/* 🌍 ASK ANYTHING */
/* ============================= */
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    let answer = `🌍 ${question}`;

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "user", content: question }
          ]
        })
      });

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || answer;
    }

    res.json({ answer });

  } catch (err) {
    res.status(500).json({
      answer: "❌ AI not responding"
    });
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
