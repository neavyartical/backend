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
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ADMIN_EMAIL = "neavyartical@gmail.com";

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err.message));

// ===== MODELS =====
const User = mongoose.model("User", new mongoose.Schema({
  email: String,
  credits: { type: Number, default: 20 },
  premium: { type: Boolean, default: false },
  earnings: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 }
}));

// ===== ROOT (IMPORTANT FOR RENDER TEST) =====
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
    res.status(401).json({ error: "Invalid token" });
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

// ===== SAFE FETCH (TIMEOUT) =====
async function safeFetch(url, options) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 8000)
    )
  ]);
}

// ===== TEXT AI =====
app.post("/generate-text", auth, async (req, res) => {
  try {
    const response = await safeFetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: req.body.prompt }]
        })
      }
    );

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content || "No response";

    res.json({ result });

  } catch (err) {
    console.log(err);
    res.json({ error: "AI failed" });
  }
});

// ===== IMAGE (FIXED + ALWAYS WORKS) =====
app.post("/generate-image", auth, async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) return res.json({ error: "Prompt empty" });

    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.random()}`;

    res.json({ image, source: "pollinations" });

  } catch (err) {
    console.log(err);

    const fallback = `https://picsum.photos/1024?random=${Math.random()}`;

    res.json({ image: fallback, source: "fallback" });
  }
});

// ===== REELS =====
app.post("/generate-reel", auth, async (req, res) => {
  try {
    const response = await safeFetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: "Create viral TikTok reel: " + req.body.prompt
          }]
        })
      }
    );

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content || "No reel";

    res.json({ result });

  } catch (err) {
    console.log(err);
    res.json({ error: "Reel failed" });
  }
});

// ===== DASHBOARD =====
app.get("/dashboard", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user);
});

// ===== SUBSCRIBE =====
app.post("/subscribe", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  user.premium = true;
  user.credits += 500;
  await user.save();

  res.json({ message: "Premium activated 🚀" });
});

// ===== REFERRAL =====
app.post("/referral", async (req, res) => {
  const { refEmail } = req.body;

  const user = await User.findOne({ email: refEmail });
  if (!user) return res.json({ error: "Invalid referral" });

  user.earnings += 1;
  user.referrals += 1;
  await user.save();

  res.json({ message: "Referral counted" });
});

// ===== START SERVER (FIXED FOR RENDER) =====
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server live on port ${PORT}`);
});
