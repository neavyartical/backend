require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err.message));

// ===== MODELS =====
const User = mongoose.model("User", new mongoose.Schema({
  email: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
}));

const Prompt = mongoose.model("Prompt", new mongoose.Schema({
  email: String,
  prompt: String,
  result: String,
  createdAt: { type: Date, default: Date.now }
}));

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend LIVE");
});

// ===== AUTH =====
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.json({ error: "Email required" });

  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user });
});

// ===== TEXT AI (UNLIMITED) =====
app.post("/generate-text", auth, async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) return res.json({ error: "Prompt empty" });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response";

    await Prompt.create({
      email: req.user.email,
      prompt,
      result: reply
    });

    res.json({ result: reply });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ===== IMAGE (UNLIMITED) =====
app.post("/generate-image", auth, async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) return res.json({ error: "Prompt empty" });

    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    res.json({ image });

  } catch {
    res.status(500).json({ error: "Image failed" });
  }
});

// ===== HISTORY =====
app.get("/history", auth, async (req, res) => {
  const data = await Prompt.find({ email: req.user.email })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(data);
});

// ===== PAYMENT (OPTIONAL) =====
app.post("/verify-payment", auth, async (req, res) => {
  res.json({ message: "✅ Payment received (manual mode)" });
});

// ===== START =====
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
