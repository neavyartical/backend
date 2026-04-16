require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(express.json({ limit: "20mb" }));

/* =========================
   Firebase
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
    console.log("✅ Firebase initialized");
  }
} catch (error) {
  console.error("❌ Firebase error:", error.message);
}

/* =========================
   MongoDB
========================= */
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.log("❌ Mongo error:", err.message));
}

/* =========================
   User Model
========================= */
const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  credits: { type: Number, default: 50 },
  requests: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

/* =========================
   Auth Middleware
========================= */
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "");

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
   Root
========================= */
app.get("/", (req, res) => {
  res.json({ status: "Backend LIVE" });
});

/* =========================
   Generate Text
========================= */
app.post("/generate-text", authMiddleware, async (req, res) => {
  try {
    const { prompt, language } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [{
          role: "user",
          content: `Write a cinematic story in ${language || "English"}.\nPrompt:${prompt}`
        }]
      })
    });

    const data = await response.json();

    res.json({
      data: {
        content: data?.choices?.[0]?.message?.content || "No response"
      }
    });

  } catch {
    res.status(500).json({ error: "Text generation failed" });
  }
});

/* =========================
   Generate Image
========================= */
app.post("/generate-image", authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Date.now()}`;

    res.json({
      data: {
        url: imageUrl
      }
    });

  } catch {
    res.status(500).json({ error: "Image generation failed" });
  }
});

/* =========================
   Generate Video
========================= */
app.post("/generate-video", authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;

    const createRes = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptText: prompt
      })
    });

    const createData = await createRes.json();
    console.log("Runway create:", JSON.stringify(createData, null, 2));

    const taskId = createData?.id;

    if (!taskId) {
      return res.status(500).json({
        error: createData
      });
    }

    await new Promise(resolve => setTimeout(resolve, 15000));

    const statusRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`
      }
    });

    const statusData = await statusRes.json();
    console.log("Runway status:", JSON.stringify(statusData, null, 2));

    const videoUrl =
      statusData?.output?.video ||
      statusData?.output?.[0] ||
      null;

    if (!videoUrl) {
      return res.status(500).json({
        error: statusData
      });
    }

    res.json({
      preview: videoUrl
    });

  } catch (error) {
    console.error("Video error:", error.message);

    res.status(500).json({
      error: "Video generation failed"
    });
  }
});

/* =========================
   Admin
========================= */
app.get("/admin", async (req, res) => {
  const users = await User.countDocuments();
  res.json({ users });
});

/* =========================
   Start
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
