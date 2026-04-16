require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// =========================
// FIREBASE ADMIN FIX
// =========================
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

// =========================
// MONGODB
// =========================
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("❌ MongoDB error:", err));

// =========================
// USER MODEL
// =========================
const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  credits: {
    type: Number,
    default: 100
  },
  requests: {
    type: Number,
    default: 0
  }
});

const User = mongoose.model("User", userSchema);

// =========================
// AUTH MIDDLEWARE
// =========================
async function verifyUser(req, res, next) {
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
        email: decoded.email,
        credits: 100
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.log("Auth error:", err.message);
    req.user = null;
    next();
  }
}

// =========================
// HOME
// =========================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 ReelMind backend running"
  });
});

// =========================
// USER INFO
// =========================
app.get("/me", verifyUser, async (req, res) => {
  if (!req.user) {
    return res.json({
      credits: "∞"
    });
  }

  res.json({
    email: req.user.email,
    credits: req.user.credits
  });
});

// =========================
// GENERATE TEXT / STORIES
// =========================
app.post("/generate-text", verifyUser, async (req, res) => {
  try {
    const { prompt, language } = req.body;

    const fullPrompt = `
Write a detailed cinematic story in ${language || "English"}.
Make it long, engaging, emotional and high quality.
Prompt:
${prompt}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ],
        max_tokens: 3000
      })
    });

    const data = await response.json();

    if (req.user) {
      req.user.credits -= 1;
      req.user.requests += 1;
      await req.user.save();
    }

    res.json({
      data: {
        content:
          data?.choices?.[0]?.message?.content ||
          "No response"
      }
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// GENERATE IMAGE
// =========================
app.post("/generate-image", verifyUser, async (req, res) => {
  try {
    const { prompt } = req.body;

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Date.now()}`;

    if (req.user) {
      req.user.credits -= 1;
      req.user.requests += 1;
      await req.user.save();
    }

    res.json({
      data: {
        url: imageUrl
      }
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// GENERATE VIDEO PLACEHOLDER
// =========================
app.post("/generate-video", verifyUser, async (req, res) => {
  res.json({
    preview: "",
    message: "Video generation backend can be connected later."
  });
});

// =========================
// ADMIN
// =========================
app.get("/admin", async (req, res) => {
  const users = await User.countDocuments();
  const total = await User.aggregate([
    {
      $group: {
        _id: null,
        requests: { $sum: "$requests" }
      }
    }
  ]);

  res.json({
    users,
    requests: total[0]?.requests || 0
  });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
