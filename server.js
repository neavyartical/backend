import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= DATABASE CONNECT ================= */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log("❌ MONGO_URI missing in ENV");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  }
};

connectDB();

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("🚀 ReelMind Backend Running");
});

/* ================= GENERATE ================= */
app.post("/generate", async (req, res) => {
  const { prompt, type } = req.body;

  try {
    let story = "";
    let image = "";
    let video = "";

    /* 🔥 GENERATE STORY ONLY */
    if (type === "story") {
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
        story = data.choices?.[0]?.message?.content || "Story failed";
      }
    }

    /* 🖼️ GENERATE IMAGE ONLY */
    if (type === "image") {
      image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    }

    /* 🎬 GENERATE VIDEO (TEMP DISABLED SAFE MODE) */
    if (type === "video") {
      video = "⚠️ Video generation coming soon";
    }

    /* 🔥 GENERATE ALL */
    if (type === "all") {
      story = `🔥 Story for: ${prompt}`;
      image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;
      video = "";
    }

    res.json({
      story,
      image,
      video
    });

  } catch (err) {
    console.error("❌ Generate Error:", err.message);
    res.status(500).json({
      story: "❌ Failed",
      image: "",
      video: ""
    });
  }
});

/* ================= ASK ANYTHING ================= */
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    let answer = "⚠️ No response";

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

  } catch (err) {
    console.error("❌ Ask Error:", err.message);
    res.status(500).json({ answer: "❌ AI not responding" });
  }
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
