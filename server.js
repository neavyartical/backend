require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB ERROR:", err.message));

// ===== USER MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  email: { type: String, unique: true },
  credits: { type: Number, default: 20 },
  premium: { type: Boolean, default: false },
  earnings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}));

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend LIVE");
});

// ===== AUTH =====
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ===== LOGIN / REGISTER =====
app.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user });
});

// ===== CREDIT SYSTEM =====
async function useCredit(user) {
  if (!user.premium && user.credits <= 0) return false;

  if (!user.premium) {
    user.credits -= 1;
    await user.save();
  }

  return true;
}

// ===== GENERATE TEXT =====
app.post("/generate-text", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!(await useCredit(user)))
      return res.json({ error: "No credits left" });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "user", content: req.body.prompt }
        ]
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || "No response";

    res.json({
      result: reply,
      credits: user.credits
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// ===== GENERATE IMAGE =====
app.post("/generate-image", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!(await useCredit(user)))
      return res.json({ error: "No credits left" });

    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;

    res.json({
      image,
      credits: user.credits
    });

  } catch (err) {
    res.status(500).json({ error: "Image generation failed" });
  }
});

// ===== VIRAL REEL =====
app.post("/viral-reel", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!(await useCredit(user)))
      return res.json({ error: "No credits left" });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: "Create a viral TikTok reel: " + req.body.prompt
        }]
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || "Reel failed";

    res.json({
      result: reply,
      credits: user.credits
    });

  } catch (err) {
    res.status(500).json({ error: "Reel generation failed" });
  }
});

// ===== PAYMENT (KO-FI) =====
app.get("/pay", (req, res) => {
  res.json({
    url: "https://ko-fi.com/articalneavy"
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
