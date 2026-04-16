require("dotenv").config();

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

const app = express();

/* =========================
   BASIC MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* =========================
   FIREBASE ADMIN INIT
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

    console.log("Firebase Admin connected successfully");
  }
} catch (error) {
  console.error("Firebase initialization error:", error.message);
}

/* =========================
   AUTH MIDDLEWARE
========================= */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split("Bearer ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;
    next();

  } catch (error) {
    console.error("Auth verify error:", error.message);
    req.user = null;
    next();
  }
}

/* =========================
   USER PROFILE
========================= */
app.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({
        email: "Guest",
        credits: 0
      });
    }

    res.json({
      email: req.user.email || "User",
      credits: 50
    });

  } catch (error) {
    res.status(500).json({
      error: "Unable to load profile"
    });
  }
});

/* =========================
   TEST AUTH
========================= */
app.get("/test-auth", authMiddleware, (req, res) => {
  res.json({
    authenticated: !!req.user,
    user: req.user || null
  });
});

/* =========================
   TEXT GENERATION
========================= */
app.post("/generate-text", authMiddleware, async (req, res) => {
  const { prompt } = req.body;

  try {
    res.json({
      data: {
        content: `Generated story for: ${prompt}`
      }
    });
  } catch {
    res.status(500).json({
      error: "Text generation failed"
    });
  }
});

/* =========================
   IMAGE GENERATION
========================= */
app.post("/generate-image", authMiddleware, async (req, res) => {
  try {
    res.json({
      data: {
        url: "https://via.placeholder.com/800x450.png?text=Generated+Image"
      }
    });
  } catch {
    res.status(500).json({
      error: "Image generation failed"
    });
  }
});

/* =========================
   VIDEO GENERATION
========================= */
app.post("/generate-video", authMiddleware, async (req, res) => {
  try {
    res.json({
      preview: "https://www.w3schools.com/html/mov_bbb.mp4"
    });
  } catch {
    res.status(500).json({
      error: "Video generation failed"
    });
  }
});

/* =========================
   VIDEO STATUS
========================= */
app.get("/video-status/:id", async (req, res) => {
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
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
