import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("🔐 KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

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
        model: "meta-llama/llama-3-8b-instruct",

        // ⚡ BALANCED SPEED + QUALITY
        max_tokens: 800,
        temperature: 0.9,

        messages: [
          {
            role: "system",
            content: "You are ReelMind AI PRO. You create cinematic, viral, emotional content."
          },
          {
            role: "user",
            content: `
Topic: ${prompt}

Generate:

🎬 5 Viral Story Ideas (DETAILED)
Each must include:
- Title
- Hook (very strong)
- Concept explanation
- Short cinematic script (3–5 lines)

🎤 Voiceover Script (full narration)

🖼 Image Prompt (for thumbnail)

📱 Caption + Hashtags

Make everything emotional, addictive, and social-media ready.
`
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.json({ result: "API Error ❌: " + data.error.message });
    }

    res.json({
      result: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error(err);
    res.json({ result: "Server error ❌" });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
