import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ ENV KEY (from Render)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// API ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openchat/openchat-3.5",
        messages: [
          {
            role: "system",
            content: `
You are ReelMind AI.

Generate:
- 3 DIFFERENT viral TikTok ideas
- Each must include:
  Title
  Hook
  Concept
  Full Script
  CTA

Make them cinematic, viral, emotional, and highly engaging.
`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    console.log("API RESPONSE:", data);

    if (data.error) {
      return res.json({
        result: "API Error ❌: " + data.error.message
      });
    }

    const output =
      data.choices?.[0]?.message?.content || "No response";

    res.json({ result: output });

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
