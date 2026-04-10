import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config(); // ✅ VERY IMPORTANT (loads env variables)

const app = express();

app.use(cors());
app.use(express.json());

// ✅ READ ENV KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🔍 DEBUG (shows real value)
console.log("ENV KEY VALUE:", process.env.OPENROUTER_API_KEY);
console.log("OPENROUTER_API_KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("🚀 Backend working");
});

// GENERATE ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter prompt first" });
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
    console.error(err);
    res.json({ result: "Server error ❌
