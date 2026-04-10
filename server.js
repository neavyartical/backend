import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ ENV KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("OPENROUTER:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// Fix path (optional frontend hosting)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ✅ TEST ROUTE (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Running");
});

// ✅ GENERATE ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    // 🧠 fallback if no prompt
    if (!prompt) {
      return res.json({ result: "Please enter a prompt" });
    }

    // 🚨 if key missing
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
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    console.log("API RESPONSE:", JSON.stringify(data, null, 2));

    // ✅ SAFE RESPONSE
    const output =
      data?.choices?.[0]?.message?.content ||
      "No AI response returned";

    res.json({ result: output });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({ result: "Server crashed ❌" });
  }
});

// ✅ START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
