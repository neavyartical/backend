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
   FIREBASE INIT
========================= */
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      })
    });
    console.log("Firebase connected");
  } catch {
    console.log("Firebase skipped");
  }
}

/* =========================
   MONGO INIT
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

/* =========================
   CREDIT
========================= */
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
async function auth(req, res, next) {
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
   ROOT
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "ReelMind backend running"
  });
});

/* =========================
   PROFILE
========================= */
app.get("/me", auth, (req, res) => {
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
   GENERATE TEXT
========================= */
app.post("/generate-text", auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.text);

  if (!allowed) {
    return res.status(403).json({ error: "Not enough credits" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Write cinematic immersive stories."
          },
          {
            role: "user",
            content: req.body.prompt
          }
        ]
      }),
      timeout: 15000
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
   GENERATE IMAGE
========================= */
app.post("/generate-image", auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.image);

  if (!allowed) {
    return res.status(403).json({ error: "Not enough credits" });
  }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;

  res.json({
    data: { url }
  });
});

/* =========================
   GENERATE VIDEO
========================= */
app.post("/generate-video", auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.video);

  if (!allowed) {
    return res.status(403).json({ error: "Not enough credits" });
  }

  try {
    const response = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06"
      },
      body: JSON.stringify({
        model: "gen4.5",
        promptText: req.body.prompt,
        ratio: "1280:720",
        duration: 5
      }),
      timeout: 20000
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
        },
        timeout: 10000
      }
    );

    const data = await response.json();

    res.json({
      status: data?.status || "processing",
      video: data?.output?.[0] || null
    });

  } catch {
    res.json({
      status: "failed",
      video: null
    });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
