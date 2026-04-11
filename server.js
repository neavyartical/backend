import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ROOT CHECK */
app.get("/", (req, res) => {
  res.send("🚀 ReelMind Backend Running");
});

/* =========================
   GENERATE (SMART CONTROL)
   ========================= */
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
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: `Write a cinematic viral story: ${prompt}`,
                },
              ],
            }),
          }
        );

        const data = await response.json();
        story = data.choices?.[0]?.message?.content || story;
      }
    }

    /* ---------- IMAGE ---------- */
    if (type === "image" || type === "all") {
      image = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt
      )}?width=1024&height=1024`;
    }

    /* ---------- VIDEO (DISABLED FOR NOW) ---------- */
    if (type === "video" || type === "all") {
      video = ""; // postponed as you requested
    }

    res.json({ story, image, video });
  } catch (err) {
    console.error("Generate error:", err);

    res.status(500).json({
      story: "❌ Generation failed",
      image: "",
      video: "",
    });
  }
});

/* =========================
   ASK ANYTHING (GOOGLE AI)
   ========================= */
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    let answer = `🌍 ${question}`;

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: question }],
          }),
        }
      );

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || answer;
    }

    res.json({ answer });
  } catch (err) {
    console.error("Ask error:", err);

    res.status(500).json({
      answer: "❌ AI not responding",
    });
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
