require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "20mb" }));

/* =========================
   FIREBASE
========================= */
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      })
    });

    console.log("Firebase connected");
  }
} catch (error) {
  console.error("Firebase error:", error.message);
}

/* =========================
   MONGODB
========================= */
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err.message));
}

/* =========================
   USER MODEL
========================= */
const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  credits: {
    type: Number,
    default: 50
  },
  requests: {
    type: Number,
    default: 0
  }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

/* =========================
   JWT
========================= */
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

function createJWT(user){
  return jwt.sign(
    {
      uid: user.uid,
      email: user.email
    },
    JWT_SECRET,
    {
      expiresIn: "30d"
    }
  );
}

/* =========================
   AUTH
========================= */
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = header.replace("Bearer ", "");

    let decoded = null;

    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      decoded = jwt.verify(token, JWT_SECRET);
    }

    let user = await User.findOne({ uid: decoded.uid });

    if (!user) {
      user = await User.create({
        uid: decoded.uid,
        email: decoded.email
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Auth error:", error.message);
    req.user = null;
    next();
  }
}

/* =========================
   USER PROFILE
========================= */
app.get("/me", authMiddleware, async (req, res) => {
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
   DEDUCT CREDITS
========================= */
async function deductCredits(user, amount){
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
   GENERATE TEXT
========================= */
app.post("/generate-text", authMiddleware, async (req, res) => {
  const allowed = await deductCredits(req.user, 1);

  if (!allowed) {
    return res.status(403).json({
      error: "Not enough credits"
    });
  }

  const { prompt } = req.body;

  res.json({
    data: {
      content: `Generated story for: ${prompt}`
    }
  });
});

/* =========================
   GENERATE IMAGE
========================= */
app.post("/generate-image", authMiddleware, async (req, res) => {
  const allowed = await deductCredits(req.user, 2);

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
   GENERATE VIDEO
========================= */
app.post("/generate-video", authMiddleware, async (req, res) => {
  const allowed = await deductCredits(req.user, 5);

  if (!allowed) {
    return res.status(403).json({
      error: "Not enough credits"
    });
  }

  res.json({
    preview: "https://www.w3schools.com/html/mov_bbb.mp4"
  });
});

/* =========================
   VIDEO STATUS
========================= */
app.get("/video-status/:taskId", async (req, res) => {
  res.json({
    video: "https://www.w3schools.com/html/mov_bbb.mp4"
  });
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "ReelMind backend running"
  });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
