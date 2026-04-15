// =========================
// 🚀 IMPORTS
// =========================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

// =========================
// 🔥 INIT APP
// =========================
const app = express();

// ✅ CORS FIX (IMPORTANT)
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// =========================
// 🔐 FIREBASE ADMIN
// =========================
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("🔥 Firebase Loaded:", serviceAccount.project_id);
} catch (e) {
  console.error("❌ Firebase error:", e.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// =========================
// 🧠 MEMORY DB (TEMP)
// =========================
let userCredits = {};
let stats = {
  users: 0,
  requests: 0
};

// =========================
// 🔐 AUTH MIDDLEWARE
// =========================
const auth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;

    if (!bearer) return res.status(401).json({ error: "NO_TOKEN" });

    const token = bearer.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;

    // Track users
    if (!userCredits[decoded.uid]) {
      userCredits[decoded.uid] = 10;
      stats.users++;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
};

// =========================
// 👤 PROFILE
// =========================
app.get("/me", auth, (req, res) => {
  const uid = req.user.uid;

  if (!userCredits[uid]) userCredits[uid] = 10;

  res.json({
    uid,
    email: req.user.email,
    credits: userCredits[uid]
  });
});

// =========================
// 💳 USE CREDIT
// =========================
function useCredit(uid) {
  if (!userCredits[uid]) userCredits[uid] = 10;

  if (userCredits[uid] <= 0) return false;

  userCredits[uid]--;
  return true;
}

// =========================
// 🧠 TEXT AI
// =========================
app.post("/generate-text", auth, async (req, res) => {
  const uid = req.user.uid;
  const { prompt } = req.body;

  if (!useCredit(uid)) {
    return res.json({ error: "NO_CREDITS" });
  }

  stats.requests++;

  try {
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
            content: "You are a powerful multilingual AI. Answer clearly in any language."
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
// 🖼 IMAGE AI
// =========================
app.post("/generate-image", auth, (req, res) => {
  const uid = req.user.uid;
  const { prompt } = req.body;

  if (!useCredit(uid)) {
    return res.json({ error: "NO_CREDITS" });
  }

  stats.requests++;

  res.json({
    data: {
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    }
  });
});

// =========================
// 🎬 VIDEO AI (STARTER)
// =========================
app.post("/generate-video", auth, (req, res) => {
  const uid = req.user.uid;
  const { prompt } = req.body;

  if (!useCredit(uid)) {
    return res.json({ error: "NO_CREDITS" });
  }

  stats.requests++;

  res.json({
    status: "🎬 Video started",
    preview: "https://www.w3schools.com/html/mov_bbb.mp4",
    prompt
  });
});

// =========================
// 📊 ADMIN
// =========================
app.get("/admin", (req, res) => {
  res.json(stats);
});

// =========================
// 💰 KO-FI WEBHOOK
// =========================
app.post("/kofi-webhook", (req, res) => {
  const { email } = req.body;

  // Give credits to ALL users for now (simple system)
  Object.keys(userCredits).forEach(uid => {
    userCredits[uid] += 50;
  });

  res.send("OK");
});

// =========================
// ❤️ HEALTH CHECK
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
