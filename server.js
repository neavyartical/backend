// =========================
// 🔥 IMPORTS
// =========================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

// =========================
// 🔥 FIREBASE INIT
// =========================
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  console.error("❌ Firebase config error:", e.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
    if (!bearer) return res.status(401).json({ error: "NO_TOKEN" });

    const token = bearer.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN" });
  }
};

// =========================
// 🧠 MULTI MODEL AI ENGINE
// =========================
async function generateAI(prompt) {

  const models = [
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
    "mistralai/mixtral-8x7b"
  ];

  for (let model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "Be fast, smart, high-quality." },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await res.json();

      const output = data?.choices?.[0]?.message?.content;

      if (output) return output;

    } catch {}
  }

  return "⚠️ AI failed";
}

// =========================
// 👤 GET OR CREATE USER
// =========================
async function getUser(uid, email) {
  const ref = db.collection("users").doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    await ref.set({
      email,
      credits: 10,
      createdAt: Date.now()
    });
    return { credits: 10 };
  }

  return doc.data();
}

// =========================
// 💳 USE CREDIT
// =========================
async function useCredit(uid) {
  const ref = db.collection("users").doc(uid);

  const doc = await ref.get();
  let data = doc.data();

  if (data.credits <= 0) return false;

  await ref.update({
    credits: data.credits - 1
  });

  return true;
}

// =========================
// 🧠 GENERATE (MAIN)
// =========================
app.post("/generate", auth, async (req, res) => {

  const { prompt, mode } = req.body;
  const uid = req.user.uid;
  const email = req.user.email;

  if (!prompt) return res.json({ error: "NO_PROMPT" });

  const user = await getUser(uid, email);

  if (user.credits <= 0) {
    return res.json({ error: "NO_CREDITS" });
  }

  await useCredit(uid);

  // track stats
  await db.collection("stats").doc("global").set({
    requests: admin.firestore.FieldValue.increment(1)
  }, { merge: true });

  try {

    // TEXT
    if (mode === "text") {
      const output = await generateAI(prompt);

      return res.json({ output });
    }

    // IMAGE
    if (mode === "image") {
      return res.json({
        output: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      });
    }

    // VIDEO (placeholder real-ready)
    if (mode === "video") {
      return res.json({
        output: "🎬 Video generation queued",
        preview: "https://www.w3schools.com/html/mov_bbb.mp4"
      });
    }

  } catch (err) {
    res.json({ error: "FAILED" });
  }
});

// =========================
// 👤 USER PROFILE
// =========================
app.get("/me", auth, async (req, res) => {

  const uid = req.user.uid;
  const email = req.user.email;

  const user = await getUser(uid, email);

  res.json({
    email,
    credits: user.credits
  });
});

// =========================
// 💰 KO-FI WEBHOOK (REAL)
// =========================
app.post("/kofi-webhook", async (req, res) => {

  try {
    const data = req.body;

    // You can verify token if needed
    if (!data.email) return res.send("Ignored");

    const snapshot = await db.collection("users")
      .where("email", "==", data.email)
      .get();

    snapshot.forEach(doc => {
      doc.ref.update({
        credits: admin.firestore.FieldValue.increment(50)
      });
    });

    res.send("OK");

  } catch (e) {
    res.send("ERROR");
  }
});

// =========================
// 📊 ADMIN STATS
// =========================
app.get("/admin", async (req, res) => {

  const usersSnap = await db.collection("users").get();
  const statsDoc = await db.collection("stats").doc("global").get();

  res.json({
    users: usersSnap.size,
    requests: statsDoc.data()?.requests || 0
  });
});

// =========================
// ❤️ HEALTH
// =========================
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI GOD MODE BACKEND LIVE");
});

// =========================
// 🚀 START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
