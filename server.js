import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 ENV KEY (from Render)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Running");
});

// 🔥 MAIN GENERATE ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    console.log("📩 Prompt:", prompt);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",

        // ✅ Important headers for OpenRouter
        "HTTP-Referer": "https://reelmindbackend-1.onrender.com",
        "X-Title": "ReelMind AI"
      },
      body: JSON.stringify({
        model: "openchat/openchat-3.5-0106",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    console.log("🔥 FULL API RESPONSE:", JSON.stringify(data, null, 2));

    // ❌ Handle API errors
    if (data.error) {
      return res.json({
        result: "API Error ❌: " + data.error.message
      });
    }

    // ✅ Return AI response
    const reply = data.choices?.[0]?.message?.content;

    res.json({
      result: reply || "No response from AI"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    res.json({
      result: "Server error ❌",
      details: err.message
    });
  }
});

// START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
