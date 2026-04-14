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

// 🔥 FIREBASE ADMIN (your file)
const admin = require("./firebaseAdmin");

// ===== INIT =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30
}));

// ===== STATIC =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const upload = multer({ dest: "uploads/" });

// =====================================================
// 🧠 DATABASE
// =====================================================
let dbConnected = false;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  dbConnected = true;
  console.log("✅ MongoDB Connected");
})
.catch(err => {
  console.log("⚠️ Running MEMORY MODE:", err.message);
});

// ===== MODELS =====
const User = mongoose.model("User", new mongoose.Schema({
  uid: String,
  email: String,
  credits: { type: Number, default: 10 }
}));

const Post = mongoose.model("Post", new mongoose.Schema({
  content: String,
  type: String,
  createdAt: { type: Date, default: Date.now }
}));

// ===== MEMORY FALLBACK =====
let users = {};
let posts = {};
let requestTracker = {};

// =====================================================
// 🔐 AUTH (FIXED TOKEN)
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

    let user;

    if (!dbConnected) {
      if (!users[decoded.uid]) {
        users[decoded.uid] = { email: decoded.email, credits: 10 };
      }
      user = users[decoded.uid];
    } else {
      user = await User.findOne({ uid: decoded.uid });

      if (!user) {
        user = await User.create({
          uid: decoded.uid,
          email: decoded.email,
          credits: 10
        });
      }
    }

    req.dbUser = user;
    next();

  } catch (err) {
    console.error("❌ TOKEN ERROR:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

// =====================================================
// 👤 PROFILE
// =====================================================
app.get("/me", auth, (req, res) => {
  res.json({
    data: {
      email: req.dbUser.email,
      credits: req.dbUser.credits
    }
  });
});

// =====================================================
// 💳 CREDIT SYSTEM
// =====================================================
app.post("/use-credit", auth, async (req, res) => {
  const amount = req.body.amount || 1;

  if (req.dbUser.credits < amount) {
    return res.json({ error: "NO_CREDITS" });
  }

  req.dbUser.credits -= amount;

  if (dbConnected) await req.dbUser.save();

  res.json({ success: true, credits: req.dbUser.credits });
});

app.post("/add-credit", async (req, res) => {
  const { email, amount } = req.body;

  let user = await User.findOne({ email });
  if (!user) return res.json({ error: "User not found" });

  user.credits += amount;
  await user.save();

  res.json({ success: true, credits: user.credits });
});

// =====================================================
// 🤖 GENERATE TEXT (PAYWALL + AI)
// =====================================================
app.post("/generate-text", auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const uid = req.user.uid;

    if (!prompt) return res.json({ error: "No prompt" });

    // 🔥 RATE LIMIT PER USER
    const now = Date.now();
    if (requestTracker[uid] && now - requestTracker[uid] < 3000) {
      return res.json({ error: "Slow down ⚠️" });
    }
    requestTracker[uid] = now;

    // 🔥 CREDIT CHECK
    if (req.dbUser.credits <= 0) {
      return res.json({ error: "NO_CREDITS" });
    }

    req.dbUser.credits -= 1;
    if (dbConnected) await req.dbUser.save();

    // 🔥 AI CALL
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
        creditsLeft: req.dbUser.credits
      }
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "AI failed" });
  }
});

// =====================================================
// 📤 UPLOAD
// =====================================================
app.post("/upload", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.json({ error: "No file" });

  const type = req.file.mimetype.startsWith("video") ? "video" : "image";
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  res.json({ url, type });
});

// =====================================================
// 📱 POSTS / FEED
// =====================================================
app.post("/post", auth, async (req, res) => {
  const { content, type } = req.body;

  if (!content) return res.json({ error: "No content" });

  if (!dbConnected) {
    posts.unshift({ content, type });
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
