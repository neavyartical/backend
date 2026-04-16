require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   FIREBASE
========================= */
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined
      })
    });
  }
} catch {
  console.log("Firebase skipped");
}

/* =========================
   MONGODB
========================= */
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Mongo connected"))
    .catch(err => console.log(err.message));
}

/* =========================
   USER MODEL
========================= */
const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  credits: { type: Number, default: 50 },
  requests: { type: Number, default: 0 }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

/* =========================
   COSTS
========================= */
const COSTS = {
  text: 1,
  image: 2,
  video: 5
};

async function deductCredits(user, amount) {
  if (!user) return true;

  if (user.credits < amount) {
    return false;
  }

  user.credits -= amount;
  user.requests += 1;
  await user.save();

  return true;
}

/* =========================
   AUTH
========================= */
async function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ uid: decoded.uid });

    if (!user) {
      user = await User.create({
        uid: decoded.uid,
        email: decoded.email
      });
    }

    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
}

/* =========================
   HEALTH
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "ReelMind backend running"
  });
});

/* =========================
   CURRENT USER
========================= */
app.get("/me", authMiddleware, (req, res) => {
  if (!req.user) {
    return res.json({
      email: "Guest",
      credits: 0
    });
  }

  res.json({
    email: req.user.email,
    credits: req.user.credits
  });
});

/* =========================
   TEXT
========================= */
app.post("/generate-text", authMiddleware, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.text);

  if (!allowed) {
    return res.status(403).json({
      error: "Not enough credits"
    });
  }

  try {
    const { prompt, language } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://reelmindbackend-1.onrender.com",
        "X-Title": "ReelMind AI"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Write immersive cinematic stories."
          },
          {
            role: "user",
            content: `Write in ${language || "English"} about: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      data: {
        content: data?.choices?.[0]?.message?.content || "No response"
      }
    });
  } catch {
    res.json({
      data: {
        content: "Story generation failed"
      }
    });
  }
});

/* =========================
   IMAGE
========================= */
app.post("/generate-image", authMiddleware, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.image);

  if (!allowed) {
    return res.status(403).json({
      error: "Not enough credits"
    });
  }

  const { prompt } = req.body;

  res.json({
    data: {
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    }
  });
});

/* =========================
   VIDEO
========================= */
app.post("/generate-video", authMiddleware, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.video);

  if (!allowed) {
    return res.status(403).json({
      error: "Not enough credits"
    });
  }

  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06"
      },
      body: JSON.stringify({
        model: "gen4.5",
        promptText: prompt,
        ratio: "1280:720",
        duration: 5
      })
    });

    const data = await response.json();

    res.json({
      taskId: data?.id || null,
      preview: data?.output?.[0] || null
    });
  } catch {
    res.json({
      error: "Video generation failed"
    });
  }
});

/* =========================
   VIDEO STATUS
========================= */
app.get("/video-status/:taskId", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
          "X-Runway-Version": "2024-11-06"
        }
      }
    );

    const data = await response.json();

    res.json({
      video: data?.output?.[0] || null,
      status: data?.status || "processing"
    });
  } catch {
    res.json({
      video: null,
      status: "failed"
    });
  }
});

/* =========================
   KO-FI WEBHOOK
========================= */
app.post("/kofi-webhook", async (req, res) => {
  try {
    const payload = JSON.parse(req.body.data || "{}");

    const email = payload.email;
    const amount = Number(payload.amount || 0);

    if (!email) {
      return res.status(400).send("Missing email");
    }

    let creditsToAdd = 0;

    if (amount >= 5) creditsToAdd = 50;
    if (amount >= 10) creditsToAdd = 120;
    if (amount >= 20) creditsToAdd = 300;

    const user = await User.findOne({ email });

    if (user && creditsToAdd > 0) {
      user.credits += creditsToAdd;
      await user.save();
    }

    res.send("Credits updated");
  } catch (error) {
    console.error("Ko-fi webhook error:", error.message);
    res.status(500).send("Webhook failed");
  }
});

/* =========================
   START
========================= */
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
