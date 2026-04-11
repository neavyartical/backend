import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 API KEY FROM RENDER ENV
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt, type } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    // 🧠 TEXT GENERATION
    if (type === "text") {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openchat/openchat-7b",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();

      if (data.error) {
        return res.json({ result: "API Error ❌: " + data.error.message });
      }

      return res.json({
        type: "text",
        result: data.choices?.[0]?.message?.content || "No response"
      });
    }

    // 🖼️ IMAGE GENERATION (FAST)
    if (type === "image") {
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
      return res.json({
        type: "image",
        result: imageUrl
      });
    }

    // 🎬 VIDEO (PREVIEW)
    if (type === "video") {
      return res.json({
        type: "video",
        result: "🎬 Video idea ready:\n\n" + prompt + "\n\n(Use in CapCut / Runway ML)"
      });
    }

  } catch (err) {
    console.error(err);
    res.json({ result: "Server error ❌" });
  }
});

// START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
