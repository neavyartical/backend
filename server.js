import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY;

console.log("KEY:", API_KEY ? "SET ✅" : "MISSING ❌");

// 🔥 SMART GENERATOR
app.post("/generate-smart", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ output: "Enter prompt ❌" });
  }

  try {
    let type = "text";

    const lower = prompt.toLowerCase();

    // 🧠 Detect intent
    if (
      lower.includes("image") ||
      lower.includes("photo") ||
      lower.includes("picture") ||
      lower.includes("draw") ||
      lower.includes("dog") ||
      lower.includes("cat") ||
      lower.includes("anime")
    ) {
      type = "image";
    }

    if (lower.includes("video") || lower.includes("reel")) {
      type = "video";
    }

    // 🖼 IMAGE (REAL WORKING API)
    if (type === "image") {
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

      return res.json({
        type: "image",
        output: imageUrl
      });
    }

    // 🎬 VIDEO (SMART TEXT FOR NOW)
    if (type === "video") {
      const videoPrompt = `
Create a HIGH QUALITY viral TikTok/Reel video script for:
"${prompt}"

Include:
- Hook
- Scenes
- Camera angles
- Music suggestion
- Hashtags
      `;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [{ role: "user", content: videoPrompt }]
        })
      });

      const data = await response.json();

      return res.json({
        type: "video",
        output: data.choices?.[0]?.message?.content || "No video generated"
      });
    }

    // 🧠 TEXT / STORIES
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    res.json({
      type: "text",
      output: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error(err);
    res.json({ output: "Server error ❌" });
  }
});

// START
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Running on ${PORT}`);
});
