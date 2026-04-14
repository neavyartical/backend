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
const fs = require("fs");

// ===== INIT =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== ENSURE UPLOAD FOLDER =====
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ===== STATIC FILES =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== MULTER =====
const upload = multer({ dest: "uploads/" });

// =====================================================
// ✅ SAFE DATABASE CONNECT (FIXED)
// =====================================================
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.log("⚠️ No Mongo URI - running WITHOUT database");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Error:", err.message));
}

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

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);

// ===== SOCKET =====
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);
});

// =====================================================
// 🔐 AUTH
// =====================================================
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email });

    res.json({ data: { token: email } });

  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const user = await User.findOne({ email: token });

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    res.json({ data: user });

  } catch {
    res.status(500).json({ error: "User fetch failed" });
  }
});

// =====================================================
// 📤 UPLOAD
// =====================================================
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file" });

    const type = file.mimetype.startsWith("video") ? "video" : "image";
    const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

    res.json({ url, type });

  } catch {
    res.status(500).json({ error: "Upload failed" });
  }
});

// =====================================================
// 📱 POSTS
// =====================================================
app.post("/post", async (req, res) => {
  try {
    const { content, type } = req.body;

    const newPost = await Post.create({ content, type });
    io.emit("new_post", newPost);

    res.json({ success: true });

  } catch {
    res.status(500).json({ error: "Post failed" });
  }
});

app.get("/feed", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({ data: posts });

  } catch {
    res.status(500).json({ error: "Feed failed" });
  }
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

  } catch {
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
// 🎬 VIDEO
// =====================================================
app.post("/generate-video", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, seconds: 5 })
    });

    const data = await response.json();

    res.json({
      data: {
        url: data.output?.video_url || "Processing..."
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
