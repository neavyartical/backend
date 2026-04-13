require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const ADMIN_EMAIL = "neavyartical@gmail.com";

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err.message));

// ===== MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  email: String,
  password: String,
  credits: { type: Number, default: 50 },
  premium: { type: Boolean, default: false },
  earnings: { type: Number, default: 0 }
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
    res.status(401).json({ error: "Invalid token" });
  }
}

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) return res.json({ error: "User exists" });

  user = await User.create({ email, password });
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user });
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email, password });

  // fallback guest login
  if (!user && email === "guest@user.com") {
    user = await User.create({ email });
  }

  if (!user) return res.json({ error: "Invalid login" });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user });
});

// ===== TEXT =====
app.post("/generate-text", auth, async (req, res) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: req.body.prompt
        }]
      })
    });

    const data = await response.json();

    res.json({
      result: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch {
    res.json({ error: "AI failed" });
  }
});

// ===== IMAGE (ALWAYS WORKING) =====
app.post("/generate-image", auth, async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Math.random()}`;
    const fallback = `https://picsum.photos/800?random=${Math.random()}`;

    res.json({ image, fallback });

  } catch {
    res.json({
      image: `https://picsum.photos/800?random=${Math.random()}`
    });
  }
});

// ===== VIDEO (RUNWAY READY STRUCTURE) =====
app.post("/generate-video", auth, async (req, res) => {
  try {
    // 👉 Replace later with Runway API
    const video = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";

    res.json({
      video,
      message: "Demo video - ready for real API"
    });

  } catch {
    res.json({ error: "Video failed" });
  }
});

// ===== REEL =====
app.post("/generate-reel", auth, async (req, res) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: "Create viral reel: " + req.body.prompt
        }]
      })
    });

    const data = await response.json();

    res.json({
      result: data?.choices?.[0]?.message?.content || "No reel"
    });

  } catch {
    res.json({ error: "Reel failed" });
  }
});

// ===== KO-FI WEBHOOK =====
app.post("/kofi-webhook", async (req, res) => {
  const { email, amount } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    user.premium = true;
    user.credits += 500;
    user.earnings += amount || 0;
    await user.save();
  }

  res.send("OK");
});

// ===== DASHBOARD =====
app.get("/dashboard", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user);
});

// ===== START =====
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});
