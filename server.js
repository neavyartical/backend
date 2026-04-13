const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
require('dotenv').config();

const app = express();

// --- CORS Configuration ---
app.use(cors({ origin: "*" })); 
app.use(express.json());

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "reelmind_global_key_2026";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err.message));

// --- User Model ---
const User = mongoose.model("User", new mongoose.Schema({
  email: { type: String, unique: true },
  credits: { type: Number, default: 20 },
  premium: { type: Boolean, default: false }
}));

// --- Auth Middleware ---
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: "Invalid token" }); }
};

// --- Routes ---

app.get("/", (req, res) => res.send("🚀 ReelMind AI Backend Live"));

app.post("/login", async (req, res) => {
  const { email } = req.body;
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email });
  const token = jwt.sign({ email: user.email }, JWT_SECRET);
  res.json({ token, user });
});

// GENERATE TEXT
app.post("/generate-text", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user.premium && user.credits <= 0) return res.json({ error: "No credits" });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://reelmind.ai", 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: req.body.prompt }]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "API Error";

    if (!user.premium) { user.credits--; await user.save(); }
    res.json({ result: reply, credits: user.credits });
  } catch (err) { res.status(500).json({ error: "Text Generation Failed" }); }
});

// GENERATE IMAGE
app.post("/generate-image", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  if (!user.premium && user.credits <= 0) return res.json({ error: "No credits" });

  const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(req.body.prompt)}?width=1024&height=1024&nologo=true&seed=${Math.random()}`;
  
  if (!user.premium) { user.credits--; await user.save(); }
  res.json({ image: imageUrl, credits: user.credits });
});

app.listen(PORT, () => console.log(`🚀 API active on port ${PORT}`));
