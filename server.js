import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 YOUR KEYS (PUT INSIDE RENDER ENV)
const OPENROUTER_API = process.env.OPENROUTER_API_KEY;
const RUNWAY_API = process.env.RUNWAY_API_KEY;

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

// MAIN GENERATE ROUTE
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    // =========================
    // 1. STORY (OpenRouter)
    // =========================
    let story = "Story failed";

    if (OPENROUTER_API) {
      const storyRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Write a cinematic viral short story about: ${prompt}`
            }
          ]
        })
      });

      const storyData = await storyRes.json();
      story = storyData.choices?.[0]?.message?.content || "Story failed";
    }

    // =========================
    // 2. IMAGE (Free fallback)
    // =========================
    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    // =========================
    // 3. VIDEO (Runway placeholder structure)
    // =========================
    let video = "";

    if (RUNWAY_API) {
      // ⚠️ REAL Runway requires async job system
      // For now we simulate response (so frontend works)
      video = "https://www.w3schools.com/html/mov_bbb.mp4";
    }

    res.json({
      story,
      image,
      video
    });

  } catch (err) {
    console.error(err);
    res.json({
      story: "❌ AI Error",
      image: "",
      video: ""
    });
  }
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
