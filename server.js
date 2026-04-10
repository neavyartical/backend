import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 ENV KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("🔐 KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// 🚀 GENERATE ROUTE
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
        // ✅ WORKING MODEL (FIXED)
        model: "meta-llama/llama-3-8b-instruct",

        messages: [
          {
            role: "system",
            content: "You are a viral TikTok content creator. Always generate multiple engaging ideas."
          },
          {
            role: "user",
            content: `Create 3 viral TikTok ideas about: ${prompt}. Include title, hook, and short script for each.`
          }
        ]
      })
    });

    const data = await response.json();

    console.log("📦 API RESPONSE:", data);

    // ❌ HANDLE ERROR
    if (data.error) {
      return res.json({
        result: "API Error ❌: " + data.error.message
      });
    }

    // ✅ SUCCESS
    res.json({
      result: data.choices?.[0]?.message?.content || "No response"
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
