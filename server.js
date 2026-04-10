import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 YOUR API KEY (TEMPORARY)
const OPENROUTER_API_KEY = "PASTE_YOUR_NEW_KEY_HERE";

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Check key
console.log("OPENROUTER:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// ✅ GENERATION ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

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

    console.log("API RESPONSE:", data);

    res.json({
      result: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Generation failed" });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
