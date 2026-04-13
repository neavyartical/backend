const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET;
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

const stripe = new Stripe(STRIPE_SECRET);

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

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend LIVE");
});

// ===== LOGIN / REGISTER =====
app.post("/login", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email });
  }

  const token = jwt.sign({ email }, JWT_SECRET);

  res.json({ token, user });
});

// ===== DASHBOARD =====
app.get("/dashboard", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user);
});

// ===== CREDIT CHECK =====
async function useCredit(user) {
  if (!user.premium && user.credits <= 0) return false;

  if (!user.premium) {
    user.credits--;
    await user.save();
  }

  return true;
}

// ===== AI TEXT =====
app.post("/generate-text", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  if (!(await useCredit(user)))
    return res.json({ error: "No credits left" });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: req.body.prompt }]
      })
    });

    const data = await response.json();

    res.json({
      result: data?.choices?.[0]?.message?.content || "No response",
      credits: user.credits
    });

  } catch (err) {
    res.status(500).json({ error: "AI generation failed" });
  }
});

// ===== IMAGE (POLLINATIONS) =====
app.post("/generate-image", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  if (!(await useCredit(user)))
    return res.json({ error: "No credits left" });

  const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;

  res.json({ image, credits: user.credits });
});

// ===== VIRAL REEL =====
app.post("/viral-reel", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  if (!(await useCredit(user)))
    return res.json({ error: "No credits left" });

  try {
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
          content: "Create a viral TikTok reel script with hook, scenes, captions and hashtags: " + req.body.prompt
        }]
      })
    });

    const data = await response.json();

    res.json({
      result: data?.choices?.[0]?.message?.content || "No reel generated",
      credits: user.credits
    });

  } catch {
    res.status(500).json({ error: "Reel generation failed" });
  }
});

// ===== VIDEO (RUNWAY READY) =====
app.post("/generate-video", auth, async (req, res) => {
  try {
    // ⚠️ Replace with real Runway endpoint when ready
    res.json({
      status: "ready",
      message: "Runway integration endpoint placeholder",
      prompt: req.body.prompt
    });
  } catch {
    res.status(500).json({ error: "Video failed" });
  }
});

// ===== STRIPE PAYMENT =====
app.post("/pay", auth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "ReelMind Premium Upgrade" },
          unit_amount: 999
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    res.json({ url: session.url });

  } catch {
    res.status(500).json({ error: "Stripe failed" });
  }
});

// ===== PAYPAL =====
app.get("/paypal", (req, res) => {
  res.json({
    url: "https://www.paypal.com/paypalme/YOURNAME/10"
  });
});

// ===== ADMIN =====
app.get("/admin", async (req, res) => {
  const users = await User.find();

  res.json({
    totalUsers: users.length,
    totalRevenue: users.reduce((sum, u) => sum + u.earnings, 0),
    users
  });
});

// ===== START =====
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
