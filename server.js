require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "fallbacksecret";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

// ===== MODELS =====
const User = mongoose.model("User", new mongoose.Schema({
  email: String,
  credits: { type: Number, default: 20 },
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
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });

  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ===== GENERATE TEXT =====
app.post("/generate-text", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.json({ error: "User not found" });
    if (user.credits <= 0) return res.json({ error: "No credits left" });

    user.credits -= 1;
    await user.save();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
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
    const reply = data?.choices?.[0]?.message?.content || "No response";

    // SAVE HISTORY
    await Prompt.create({
      email: req.user.email,
      prompt: req.body.prompt,
      result: reply
    });

    res.json({
      result: reply,
      credits: user.credits
    });

  } catch (err) {
    res.status(500).json({ error: "AI failed" });
  }
});

// ===== GENERATE IMAGE =====
app.post("/generate-image", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.json({ error: "User not found" });
    if (user.credits <= 0) return res.json({ error: "No credits left" });

    user.credits -= 1;
    await user.save();

    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;

    res.json({
      image,
      credits: user.credits
    });

  } catch {
    res.status(500).json({ error: "Image failed" });
  }
});

// ===== GET HISTORY =====
app.get("/history", auth, async (req, res) => {
  const data = await Prompt.find({ email: req.user.email }).sort({ createdAt: -1 });
  res.json(data);
});

// ===== START =====
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
