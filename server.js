import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* 🔥 IMPORTANT (SERVES FRONTEND) */
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

/* ================= DEBUG ================= */
console.log("OPENROUTER_KEY:", process.env.OPENROUTER_KEY ? "LOADED ✅" : "MISSING ❌");

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("ReelMind AI Backend Running 🚀");
});

/* ================= AI GENERATION ================= */
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ error: "No prompt provided" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a viral content creator AI." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    console.log("AI RESPONSE:", data);

    res.json({
      result: data.choices?.[0]?.message?.content || "No response from AI"
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({ error: "AI failed" });
  }
});

/* ================= BUY PLAN ================= */
app.post("/buy-plan", (req, res) => {
  const { plan } = req.body;

  let credits = 0;

  if (plan === "basic") credits = 100;
  if (plan === "pro") credits = 300;
  if (plan === "ultimate") credits = 1000;

  res.json({
    message: "Plan activated",
    credits
  });
});

/* ================= ENV CHECK ================= */
app.get("/check-env", (req, res) => {
  res.json({
    openrouter: process.env.OPENROUTER_KEY ? "OK" : "MISSING"
  });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
