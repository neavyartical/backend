// ===== IMPORTS =====
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const rateLimit = require("express-rate-limit");

// 🔥 FIREBASE ADMIN
const admin = require("./firebaseAdmin");

// ===== INIT =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ===== GLOBAL RATE LIMIT (ANTI SPAM) =====
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 requests/min per IP
  message: { error: "Too many requests, slow down ⚠️" }
});

app.use(limiter);

// ===== MIDDLEWARE =====
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10mb" }));

// ===== STATIC =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== FILE UPLOAD =====
const upload = multer({ dest: "uploads/" });

// =====================================================
// 🔐 FIREBASE AUTH
// =====================================================
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
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// =====================================================
// 🧠 DATABASE
// =====================================================
let dbConnected = false;

if (!process.env.MONGO_URI) {
  console.log("⚠️ No Mongo URI → MEMORY MODE");
} else {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      dbConnected = true;
      console.log("✅ MongoDB Connected");
    })
    .catch(err => {
      console.log("❌ Mongo Error:", err.message);
    });
}

// ===== MEMORY =====
let users = {};
let posts = {};
let requestTracker = {}; // 🔥 anti abuse tracker

// ===== SCHEMAS =====
const UserSchema = new mongoose.Schema({
  email: String,
  credits: { type: Number, default: 1000 },
  referrals: { type: Number, default: 0 }
});

const PostSchema = new mongoose.Schema({
  content: String,
  type: String,
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

// ===== SOCKET =====
io.on("connection", (socket) => {
  console.log("🟢 User:", socket.id);
});

// =====================================================
// 👤 PROFILE
// =====================================================
app.get("/me", auth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;

    if (!dbConnected) {
      if (!users[uid]) users[uid] = { email, credits: 1000 };
      return res.json({ data: users[uid] });
    }

    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email });

    res.json({ data: user });

  } catch {
    res.status(500).json({ error: "Profile failed" });
  }
});

// =====================================================
// 📤 UPLOAD
// =====================================================
app.post("/upload", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });

  const type = req.file.mimetype.startsWith("video") ? "video" : "image";

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  res.json({ url, type });
});

// =====================================================
// 📱 POSTS
// =====================================================
app.post("/post", auth, async (req, res) => {
  const { content, type } = req.body;

  if (!content) return res.status(400).json({ error: "No content" });

  if (!dbConnected) {
    if (!posts.list) posts.list = [];
    posts.list.unshift({ content, type, likes: 0 });
    return res.json({ success: true });
  }

  const newPost = await Post.create({ content, type });
  io.emit("new_post", newPost);

  res.json({ success: true });
});

app.get("/feed", async (req, res) => {
  if (!dbConnected) return res.json({ data: posts.list || [] });

  const data = await Post.find().sort({ createdAt: -1 });
  res.json({ data });
});

// =====================================================
// 🤖 AI TEXT (WITH ANTI ABUSE)
// =====================================================
app.post("/generate-text", auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const uid = req.user.uid;
    const email = req.user.email;

    // 🔥 INPUT VALIDATION
    if (!prompt || prompt.length < 3) {
      return res.json({ error: "Prompt too short" });
    }

    // 🔥 ANTI-SPAM USER LIMIT (cooldown 3s)
    const now = Date.now();
    if (requestTracker[uid] && now - requestTracker[uid] < 3000) {
      return res.json({ error: "Slow down ⚠️" });
    }
    requestTracker[uid] = now;

    let user;

    if (!dbConnected) {
      if (!users[uid]) users[uid] = { email, credits: 1000 };
      user = users[uid];
    } else {
      user = await User.findOne({ email }) || await User.create({ email });
    }

    if (!user || user.credits <= 0) {
      return res.json({ error: "No credits left" });
    }

    user.credits = Math.max(0, user.credits - 1);
    if (dbConnected) await user.save();

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
      data: {
        content,
        creditsLeft: user.credits
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

// =====================================================
// 🖼️ IMAGE
// =====================================================
app.post("/generate-image", auth, (req, res) => {
  const { prompt } = req.body;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  res.json({ data: { url } });
});

// =====================================================
// 🎬 VIDEO
// =====================================================
app.post("/generate-video", auth, (req, res) => {
  res.json({
    data: {
      url: "https://www.w3schools.com/html/mov_bbb.mp4"
    }
  });
});

// =====================================================
// ❤️ HEALTH
// =====================================================
app.get("/", (req, res) => {
  res.send("🚀 ReelMind Backend LIVE");
});

// =====================================================
// 🚀 START
// =====================================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
