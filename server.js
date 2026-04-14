// =========================
// 🔥 IMPORTS
// =========================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const rateLimit = require("express-rate-limit");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

// =========================
// 🔥 FIREBASE ADMIN INIT (FIXED)
// =========================
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  console.log("🔥 Firebase Project:", serviceAccount.project_id);
} catch (e) {
  console.error("❌ FIREBASE KEY ERROR:", e.message);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// =========================
// 🚀 INIT SERVER
// =========================
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// =========================
// 🔥 MIDDLEWARE
// =========================
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30
});
app.use(limiter);

// =========================
// 📁 FILE UPLOAD
// =========================
const upload = multer({ dest: "uploads/" });
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================
// 🔐 AUTH FIXED (NO MORE INVALID TOKEN)
// =========================
const auth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token" });
    }

    const token = bearer.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;
    next();

  } catch (err) {
    console.error("❌ TOKEN ERROR:", err.message);

    return res.status(401).json({
      error: "Invalid token",
      details: err.message
    });
  }
};

// =========================
// 🧠 DATABASE
// =========================
let dbConnected = false;

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      dbConnected = true;
      console.log("✅ MongoDB Connected");
    })
    .catch(err => console.log("❌ Mongo Error:", err.message));
} else {
  console.log("⚠️ MEMORY MODE ACTIVE");
}

// =========================
// 🧠 MEMORY MODE
// =========================
let users = {};
let posts = [];

// =========================
// 📦 SCHEMAS
// =========================
const UserSchema = new mongoose.Schema({
  uid: String,
  email: String,
  credits: { type: Number, default: 5 }
});

const PostSchema = new mongoose.Schema({
  content: String,
  type: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

// =========================
// 👤 PROFILE
// =========================
app.get("/me", auth, async (req, res) => {
  const { uid, email } = req.user;

  if (!dbConnected) {
    if (!users[uid]) users[uid] = { email, credits: 5 };
    return res.json({ data: users[uid] });
  }

  let user = await User.findOne({ uid });
  if (!user) {
    user = await User.create({ uid, email, credits: 5 });
  }

  res.json({ data: user });
});

// =========================
// 💳 USE CREDIT
// =========================
app.post("/use-credit", auth, async (req, res) => {
  const amount = req.body.amount || 1;
  const { uid, email } = req.user;

  let user;

  if (!dbConnected) {
    if (!users[uid]) users[uid] = { email, credits: 5 };
    user = users[uid];
  } else {
    user = await User.findOne({ uid }) || await User.create({ uid, email });
  }

  if (user.credits < amount) {
    return res.json({ error: "NO_CREDITS" });
  }

  user.credits -= amount;
  if (dbConnected) await user.save();

  res.json({ success: true, credits: user.credits });
});

// =========================
// 💰 ADD CREDIT
// =========================
app.post("/add-credit", async (req, res) => {
  const { email, amount } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ error: "User not found" });

  user.credits += amount;
  await user.save();

  res.json({ success: true, credits: user.credits });
});

// =========================
// 🤖 GENERATE TEXT
// =========================
app.post("/generate-text", auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const { uid, email } = req.user;

    let user;

    if (!dbConnected) {
      if (!users[uid]) users[uid] = { email, credits: 5 };
      user = users[uid];
    } else {
      user = await User.findOne({ uid }) || await User.create({ uid, email });
    }

    if (user.credits <= 0) {
      return res.json({ error: "NO_CREDITS" });
    }

    user.credits -= 1;
    if (dbConnected) await user.save();

    // 🔥 REAL AI (OpenRouter)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response";

    res.json({
      data: { content },
      credits: user.credits
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "AI_FAILED" });
  }
});

// =========================
// 🖼️ IMAGE
// =========================
app.post("/generate-image", auth, (req, res) => {
  const { prompt } = req.body;

  res.json({
    data: {
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    }
  });
});

// =========================
// 🎬 VIDEO
// =========================
app.post("/generate-video", auth, (req, res) => {
  res.json({
    data: {
      url: "https://www.w3schools.com/html/mov_bbb.mp4"
    }
  });
});

// =========================
// 📤 UPLOAD
// =========================
app.post("/upload", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.json({ error: "No file" });

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  res.json({ url });
});

// =========================
// 📡 FEED
// =========================
app.get("/feed", async (req, res) => {
  if (!dbConnected) return res.json({ data: posts });

  const data = await Post.find().sort({ createdAt: -1 });
  res.json({ data });
});

// =========================
// 🧪 TEST AUTH
// =========================
app.get("/test-auth", auth, (req, res) => {
  res.json({
    success: true,
    uid: req.user.uid,
    email: req.user.email
  });
});

// =========================
// ❤️ HEALTH
// =========================
app.get("/", (req, res) => {
  res.send("🚀 ReelMind Backend LIVE");
});

// =========================
// 🚀 START
// =========================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
