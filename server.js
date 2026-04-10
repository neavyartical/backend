import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ USE ENV KEY (Render Environment Variable)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("🔐 KEY STATUS:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// 🚀 GENERATE ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    // 🔥 CALL OPENROUTER (FIXED MODEL)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://reelmind-ai.app", // optional but recommended
        "X-Title": "ReelMind AI"
      },
      body: JSON.stringify({
        model: "openchat/openchat-3.5-1210", // ✅ WORKING MODEL
        messages: [
          {
            role: "system",
            content: "You are a viral TikTok content creator. Generate multiple viral ideas with titles, hooks, scripts, and hashtags."
          },
          {
            role: "user",
            content: `Give me 3 viral TikTok ideas about: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();
    console.log("📦 API RESPONSE:", data);

    if (data.error) {
      return res.json({ result: "API Error ❌: " + data.error.message });
    }

    const output = data.choices?.[0]?.message?.content;

    res.json({
      result: output || "No response from AI"
    });

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    res.json({ result: "Server error ❌" });
  }
});

// 🌐 START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
