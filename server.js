require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ================= FIREBASE =================
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

// ================= MONGODB SAFE CONNECT =================
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in Render Environment");
} else {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB error:", err.message));
}

// ================= DATABASE =================
const historySchema = new mongoose.Schema({
  uid: String,
  prompt: String,
  response: String,
  mode: String,
  createdAt: { type: Date, default: Date.now }
});

const History = mongoose.models.History || mongoose.model("History", historySchema);

// ================= AUTH =================
async function verifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();

  } catch (err) {
    req.user = null;
    next();
  }
}

// ================= AI FUNCTION =================
async function generateText(prompt, language = "English") {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          content:
            `You are ReelMind AI. Generate detailed long high-quality content in ${language}.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000
    })
  });

  const data = await res.json();

  return (
    data?.choices?.[0]?.message?.content ||
    "No response from AI"
  );
}

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("Backend LIVE");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1
  });
});

// ================= USER =================
app.get("/me", verifyUser, async (req, res) => {
  res.json({
    email: req.user?.email || "Guest",
    credits: req.user ? 100 : "∞"
  });
});

// ================= GENERATE TEXT =================
app.post("/generate-text", verifyUser, async (req, res) => {
  try {
    const { prompt, language } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt required"
      });
    }

    const output = await generateText(prompt, language);

    if (req.user && mongoose.connection.readyState === 1) {
      await History.create({
        uid: req.user.uid,
        prompt,
        response: output,
        mode: "text"
      });
    }

    res.json({
      data: {
        content: output
      }
    });

  } catch (err) {
    console.error("TEXT ERROR:", err.message);

    res.status(500).json({
      data: {
        content: "Failed generating text"
      }
    });
  }
});

// ================= GENERATE IMAGE =================
app.post("/generate-image", verifyUser, async (req, res) => {
  try {
    const { prompt } = req.body;

    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Date.now()}`;

    res.json({
      data: {
        url
      }
    });

  } catch (err) {
    res.status(500).json({
      error: "Image generation failed"
    });
  }
});

// ================= GENERATE VIDEO =================
app.post("/generate-video", verifyUser, async (req, res) => {
  res.json({
    preview: null
  });
});

// ================= ADMIN =================
app.get("/admin", async (req, res) => {
  const requests =
    mongoose.connection.readyState === 1
      ? await History.countDocuments()
      : 0;

  res.json({
    users: "Live",
    requests
  });
});

// ================= START =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
