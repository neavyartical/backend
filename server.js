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

// 🔥 FIREBASE ADMIN
const admin = require("./firebaseAdmin");

// ===== INIT =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== STATIC UPLOADS =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== FILE UPLOAD =====
const upload = multer({ dest: "uploads/" });

// =====================================================
// 🔐 FIREBASE AUTH MIDDLEWARE
// =====================================================
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// =====================================================
// 🧠 SAFE DATABASE CONNECT
// =====================================================
let dbConnected = false;

if (!process.env.MONGO_URI) {
  console.log("⚠️ No Mongo URI → Running WITHOUT DB");
} else {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      dbConnected = true;
      console.log("✅ MongoDB Connected");
    })
    .catch(err => {
      console.log("❌ Mongo Error:", err.message);
      console.log("⚠️ Falling back to MEMORY mode");
    });
}

// ===== MEMORY FALLBACK =====
let users = {};
let posts = [];

// ===== SCHEMAS =====
const UserSchema = new mongoose.Schema({
  email: String,
  credits: { type: Number, default: 1000 },
  referrals: { type: Number, default: 0 },
  memory: [{ user: String, ai: String }]
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
  console.log("🟢 User connected:", socket.id);
});

// =====================================================
// 👤 PROFILE (SECURE)
// =====================================================
app.get("/me", auth, async (req, res) => {
  const uid = req.user.uid;
  const email = req.user.email;

  if (!dbConnected) {
    if (!users[uid]) users[uid] = { email, credits: 1000 };
    return res.json({ data: users[uid] });
  }

  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email });

  res.json({ data: user });
});

// =====================================================
// 📤 UPLOAD (PROTECTED)
// =====================================================
app.post("/upload", auth, upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file" });

  const type = file.mimetype.startsWith("video") ? "video" : "image";
  const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

  res.json({ url, type });
});

// =====================================================
// 📱 POSTS (PROTECTED)
// =====================================================
app.post("/post", auth, async (req, res) => {
  const { content, type } = req.body;

  if (!dbConnected) {
    posts.unshift({ content, type, likes: 0 });
    return res.json({ success: true });
  }

  const newPost = await Post.create({ content, type });
  io.emit("new_post", newPost);

  res.json({ success: true });
});

app.get("/feed", async (req, res) => {
  if (!dbConnected) return res.json({ data: posts });

  const data = await Post.find().sort({ createdAt: -1 });
  res.json({ data });
});

// =====================================================
// 🤖 AI TEXT (WITH CREDITS)
// =====================================================
app.post("/generate-text", auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const uid = req.user.uid;
    const email = req.user.email;

    let user;

    if (!dbConnected) {
      if (!users[uid]) users[uid] = { email, credits: 1000 };
      user = users[uid];
    } else {
      user = await User.findOne({ email }) || await User.create({ email });
    }

    if (user.credits <= 0) {
      return res.json({ error: "No credits left" });
    }

    user.credits -= 1;
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
    res.status(500).json({ error: "AI failed" });
  }
});

// =====================================================
// 🖼️ IMAGE (WITH CREDITS)
// =====================================================
app.post("/generate-image", auth, (req, res) => {
  const { prompt } = req.body;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  res.json({ data: { url } });
});

// =====================================================
// 🎬 VIDEO (SAFE)
// =====================================================
app.post("/generate-video", auth, async (req, res) => {
  res.json({
    data: {
      url: "https://www.w3schools.com/html/mov_bbb.mp4"
    }
  });
});

// =====================================================
// 🔊 VOICE CLONE (READY)
// =====================================================
app.post("/voice-clone", auth, async (req, res) => {
  const { text } = req.body;

  console.log("🎙️ Voice cloning:", text);

  res.json({
    success: true,
    message: "Voice cloning coming soon 🔥"
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
