import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 USE ENV VARIABLE (DO NOT HARDCODE)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Debug log
console.log("KEY STATUS:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// ✅ HEALTH CHECK (optional)
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend is running");
});

// 🚀 GENERATE ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    if (!OPENROUTER_API_KEY) {
      return res.json({ result: "API key missing ❌" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://reelmind-ai.vercel.app", // optional
        "X-Title": "ReelMind AI"
      },
      body: JSON.stringify({
        // ✅ WORKING MODEL
        model: "meta-llama/llama-3-8b-instruct",

        messages: [
          {
            role: "system",
            content: "You are a viral content creator AI. Generate engaging, high-quality viral scripts."
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

    // ❌ HANDLE API ERRORS
    if (data.error) {
      return res.json({
        result: "API Error ❌: " + data.error.message
      });
    }

    // ✅ SUCCESS RESPONSE
    res.json({
      result: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({ result: "Server error ❌" });
  }
});

// 🔥 START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
