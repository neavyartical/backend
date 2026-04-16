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
   Firebase Admin Init
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
  console.error("❌ Firebase init error:", error.message);
}

/* =========================
   MongoDB
========================= */
const mongoUri = process.env.MONGODB_URI;

console.log("Mongo URI exists:", !!mongoUri);

if (!mongoUri) {
  console.error("❌ MONGODB_URI missing");
} else {
  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch(err => {
    console.error("❌ MongoDB error:", err.message);
  });
}

/* =========================
   User Schema
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

  } catch (error) {
    console.error("Auth error:", error.message);
    req.user = null;
    next();
  }
}

/* =========================
   Health Check
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "ReelMind backend running"
  });
});

/* =========================
   Current User
========================= */
app.get("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.json({ credits: 0 });
  }

  res.json({
    email: req.user.email,
    credits: req.user.credits
  });
});

/* =========================
   Generate Text
========================= */
app.post("/generate-text", authMiddleware, async (req, res) => {
  try {
    const { prompt, language } = req.body;

    const finalPrompt = `
Write a detailed cinematic story in ${language || "English"}.
Prompt: ${prompt}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: finalPrompt
          }
        ]
      })
    });

    const data = await response.json();

    const content =
      data?.choices?.[0]?.message?.content ||
      "No story generated.";

    if (req.user) {
      req.user.requests += 1;
      await req.user.save();
    }

    res.json({
      data: {
        content
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Text generation failed"
    });
  }
});

/* =========================
   Generate Image
========================= */
app.post("/generate-image", authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Date.now()}`;

    if (req.user) {
      req.user.requests += 1;
      await req.user.save();
    }

    res.json({
      data: {
        url: imageUrl
      }
    });

  } catch (error) {
    res.status(500).json({
      error: "Image generation failed"
    });
  }
});

/* =========================
   Generate Video
========================= */
app.post("/generate-video", authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        promptText: prompt
      })
    });

    const data = await response.json();

    console.log("Runway response:", data);

    const videoUrl =
      data?.output?.video ||
      data?.url ||
      null;

    if (!videoUrl) {
      return res.status(500).json({
        error: "Video generation unavailable"
      });
    }

    if (req.user) {
      req.user.requests += 1;
      await req.user.save();
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
   Admin Stats
========================= */
app.get("/admin", async (req, res) => {
  try {
    const users = await User.countDocuments();

    const totals = await User.aggregate([
      {
        $group: {
          _id: null,
          requests: { $sum: "$requests" }
        }
      }
    ]);

    res.json({
      users,
      requests: totals[0]?.requests || 0
    });

  } catch (error) {
    res.status(500).json({
      users: 0,
      requests: 0
    });
  }
});

/* =========================
   Start Server
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
