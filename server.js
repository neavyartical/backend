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
// 🧠 SAFE DATABASE CONNECT (NO CRASH)
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

// ===== FALLBACK MEMORY STORAGE =====
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
// 🔐 AUTH
// =====================================================
app.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  if (!dbConnected) {
    if (!users[email]) users[email] = { email, credits: 1000 };
    return res.json({ data: { token: email } });
  }

  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email });

  res.json({ data: { token: email } });
});

app.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!dbConnected) {
    return res.json({ data: users[token] || {} });
  }

  const user = await User.findOne({ email: token });
  res.json({ data: user });
});

// =====================================================
// 📤 UPLOAD
// =====================================================
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file" });

  const type = file.mimetype.startsWith("video") ? "video" : "image";

  const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

  res.json({ url, type });
});

// =====================================================
// 📱 POSTS
// =====================================================
app.post("/post", async (req, res) => {
  const { content, type } = req.body;

  if (!dbConnected) {
    const post = { content, type, likes: 0 };
    posts.unshift(post);
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
// 🤖 AI
// =====================================================
app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;

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

    res.json({ data: { content } });

  } catch (err) {
    res.status(500).json({ error: "AI failed" });
  }
});

// =====================================================
// 🖼️ IMAGE (FIXED)
// =====================================================
app.post("/generate-image", (req, res) => {
  const { prompt } = req.body;

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

  res.json({ data: { url } });
});

// =====================================================
// 🎬 VIDEO (SAFE)
// =====================================================
app.post("/generate-video", async (req, res) => {
  try {
    res.json({
      data: {
        url: "https://www.w3schools.com/html/mov_bbb.mp4"
      }
    });
  } catch {
    res.status(500).json({ error: "Video failed" });
  }
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
