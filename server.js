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
  credits: { type: Number, default: 20 },
  premium: { type: Boolean, default: false },
  earnings: { type: Number, default: 0 }
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
  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.json({ error: "Email required" });

    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ===== VERIFY PAYMENT =====
app.post("/verify-payment", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    user.premium = true;
    user.credits += 100;
    await user.save();

    res.json({ message: "✅ Premium Activated", user });

  } catch {
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ===== DASHBOARD =====
app.get("/dashboard", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user);
});

// ===== TEXT AI (UPGRADED) =====
app.post("/generate-text", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.json({ error: "User not found" });

    const prompt = req.body.prompt;

    if (!prompt || prompt.trim() === "") {
      return res.json({ error: "Prompt is empty" });
    }

    if (!user.premium && user.credits <= 0) {
      return res.json({ error: "No credits left" });
    }

    if (!user.premium) {
      user.credits -= 1;
      await user.save();
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // ⚡ faster & stable
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    console.log("AI RAW:", data);

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      null;

    if (!reply) {
      return res.json({ error: "AI returned no response" });
    }

    await Prompt.create({
      email: req.user.email,
      prompt,
      result: reply
    });

    res.json({
      result: reply,
      credits: user.credits
    });

  } catch (err) {
    console.log("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ===== IMAGE =====
app.post("/generate-image", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user.premium) {
      return res.json({ error: "🔒 Premium only feature" });
    }

    if (!req.body.prompt) {
      return res.json({ error: "Prompt required" });
    }

    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;

    res.json({ image });

  } catch {
    res.status(500).json({ error: "Image failed" });
  }
});

// ===== HISTORY =====
app.get("/history", auth, async (req, res) => {
  try {
    const data = await Prompt.find({ email: req.user.email })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(data);

  } catch {
    res.status(500).json({ error: "History failed" });
  }
});

// ===== ADMIN (NEW) =====
app.get("/admin", async (req, res) => {
  const users = await User.find();

  res.json({
    totalUsers: users.length,
    users
  });
});

// ===== START =====
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
