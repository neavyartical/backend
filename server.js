const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ ENV KEYS
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const RUNWAY_KEY = process.env.RUNWAY_KEY;

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running ✅");
});

// MAIN GENERATE ROUTE
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {

    // =========================
    // 🎬 STORY (OpenRouter)
    // =========================
    let story = "Story unavailable";

    try {
      const storyRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Write a cinematic viral story about: ${prompt}`
            }
          ]
        })
      });

      const storyData = await storyRes.json();
      story = storyData.choices?.[0]?.message?.content || "Story failed";

    } catch (err) {
      console.log("Story error:", err.message);
    }

    // =========================
    // 🖼 IMAGE (Free fallback)
    // =========================
    const image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;

    // =========================
    // 🎥 VIDEO (Fallback / Runway later)
    // =========================
    let video = "https://www.w3schools.com/html/mov_bbb.mp4";

    // (Optional future Runway API goes here)

    // =========================
    // ✅ FINAL JSON RESPONSE
    // =========================
    res.json({
      success: true,
      story,
      image,
      video
    });

  } catch (error) {
    console.log("Server error:", error);

    res.status(500).json({
      success: false,
      story: "Server error",
      image: "",
      video: ""
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
