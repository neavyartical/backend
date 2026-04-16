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
if (!process.env.MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI");
} else {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB error:", err.message));
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
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

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
    credits: req.user.credits,
    requests: req.user.requests
  });
});

/* =========================
   Generate Story
========================= */
app.post("/generate-text", authMiddleware, async (req, res) => {
  try {
    const { prompt, language } = req.body;

    const finalPrompt = `
Create a cinematic, intelligent, highly detailed story in ${language || "English"}.
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
        messages: [{ role: "user", content: finalPrompt }]
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
      data: { content }
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

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Date.now()}`;

    if (req.user) {
      req.user.requests += 1;
      await req.user.save();
    }

    res.json({
      data: { url: imageUrl }
    });

  } catch (error) {
    res.status(500).json({
      error: "Image generation failed"
    });
  }
});

/* =========================
   Generate Video (Runway)
========================= */
app.post("/generate-video", authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;

    const createTask = await fetch("https://api.runwayml.com/v1/text_to_video", {
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

    const task = await createTask.json();

    if (!task.id) {
      return res.status(500).json({
        error: "Runway task creation failed",
        details: task
      });
    }

    let videoUrl = null;

    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000));

      const statusRes = await fetch(
        `https://api.runwayml.com/v1/tasks/${task.id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
            "X-Runway-Version": "2024-11-06"
          }
        }
      );

      const statusData = await statusRes.json();

      if (statusData.status === "SUCCEEDED") {
        videoUrl = statusData.output?.[0];
        break;
      }

      if (statusData.status === "FAILED") {
        break;
      }
    }

    if (!videoUrl) {
      return res.status(500).json({
        error: "Video generation failed"
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
    console.error("Runway error:", error.message);

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
