import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// Fix path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// 🔐 API KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🔍 Debug
console.log("KEY VALUE:", process.env.OPENROUTER_API_KEY);
console.log("OPENROUTER KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// Test route
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Running");
});

// Generate route
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt first ❌" });
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

    res.json({
      result: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error("FULL ERROR:", err);

    res.json({
      result: "Server error ❌",
      details: err.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
