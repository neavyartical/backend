import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ MUST MATCH RENDER ENV VARIABLE NAME
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🔍 Debug log
console.log("OPENROUTER_API_KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Working");
});

// ✅ GENERATE ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt first" });
    }

    if (!OPENROUTER_API_KEY) {
      return res.json({ result: "API key missing ❌" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    console.log("API RESPONSE:", data);

    const output =
      data?.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "No response";

    res.json({ result: output });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({ result: "Server error ❌" });
  }
});

// ✅ START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
