// =========================
// 🔥 IMPORTS
// =========================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

// =========================
// 🔥 FIREBASE ADMIN (ENV)
// =========================
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("🔥 Firebase Project:", serviceAccount.project_id);
} catch (e) {
  console.error("❌ FIREBASE ERROR:", e.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// =========================
// 🚀 INIT SERVER
// =========================
const app = express();

app.use(cors());
app.use(express.json());

// =========================
// 🔐 AUTH MIDDLEWARE
// =========================
const auth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;

    if (!bearer) return res.status(401).json({ error: "No token" });

    const token = bearer.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// =========================
// 💳 MEMORY CREDITS
// =========================
let userCredits = {};

// =========================
// 💳 USE CREDIT
// =========================
app.post("/use-credit", auth, (req, res) => {
  const uid = req.user.uid;

  if (!userCredits[uid]) userCredits[uid] = 5;

  if (userCredits[uid] <= 0) {
    return res.json({ error: "NO_CREDITS" });
  }

  userCredits[uid]--;

  res.json({
    success: true,
    credits: userCredits[uid]
  });
});

// =========================
// 💰 ADD CREDIT
// =========================
app.post("/add-credit", (req, res) => {
  const { uid, amount } = req.body;

  userCredits[uid] = (userCredits[uid] || 0) + amount;

  res.json({ success: true });
});

// =========================
// 🧠 GENERATE TEXT (OPENROUTER)
// =========================
app.post("/generate-text", auth, async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Give short, precise, high-quality answers strictly following the prompt."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      data: {
        content: data.choices?.[0]?.message?.content || "No response"
      }
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "AI_FAILED" });
  }
});

// =========================
// 🖼 IMAGE (FAST)
// =========================
app.post("/generate-image", auth, (req, res) => {
  const { prompt } = req.body;

  res.json({
    data: {
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    }
  });
});

// =========================
// 🎬 VIDEO (STARTER)
// =========================
app.post("/generate-video", auth, async (req, res) => {
  const { prompt } = req.body;

  // 🔥 TEMP PREVIEW (replace later with Runway)
  res.json({
    status: "🎬 Video generation started",
    preview: "https://www.w3schools.com/html/mov_bbb.mp4",
    prompt
  });
});

// =========================
// 👤 PROFILE
// =========================
app.get("/me", auth, (req, res) => {
  const uid = req.user.uid;

  if (!userCredits[uid]) userCredits[uid] = 5;

  res.json({
    uid,
    email: req.user.email,
    credits: userCredits[uid]
  });
});

// =========================
// ❤️ HEALTH
// =========================
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend LIVE");
});

// =========================
// 🚀 START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
