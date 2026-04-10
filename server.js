import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("🔐 KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// 🚀 GENERATE ROUTE (OPTIMIZED)
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

        // ⚡ SPEED OPTIMIZATION
        max_tokens: 400,
        temperature: 0.8,

        messages: [
          {
            role: "system",
            content: "You are ReelMind AI. Generate short, fast, high-impact viral ideas."
          },
          {
            role: "user",
            content: `Give me 3 FAST viral TikTok ideas about: ${prompt}.
            
Each idea must include:
- Title
- Hook
- 2-line script ONLY
            
Keep it short, punchy, and viral.`
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
