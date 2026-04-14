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

// 🔥 SERVE UPLOADS (IMPORTANT)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== MULTER (UPLOAD SYSTEM) =====
const upload = multer({ dest: "uploads/" });

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log("❌ MongoDB Error:", err));

// ===== SCHEMAS =====
const UserSchema = new mongoose.Schema({
  email: String,
  credits: { type: Number, default: 1000 },
  referrals: { type: Number, default: 0 },
  memory: [
    {
      user: String,
      ai: String
    }
  ]
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

    if (!user) {
      user = await User.create({ email });
    }

    res.json({ data: { token: email } });

  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    const user = await User.findOne({ email: token });

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    res.json({ data: user });

  } catch (err) {
    res.status(500).json({ error: "User fetch failed" });
  }
});

// =====================================================
// 📤 UPLOAD (REAL)
// =====================================================

app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const type = file.mimetype.startsWith("video") ? "video" : "image";

    const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

    res.json({ url, type });

  } catch (err) {
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

  } catch (err) {
    res.status(500).json({ error: "Post failed" });
  }
});

app.get("/feed", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({ data: posts });

  } catch (err) {
    res.status(500).json({ error: "Feed failed" });
  }
});

app.post("/like/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post) {
      post.likes++;
      await post.save();
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Like failed" });
  }
});

// =====================================================
// 🤖 AI (MEMORY + MODES)
// =====================================================

app.post("/generate-text", async (req, res) => {
  try {
    const { prompt, mode } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    const user = await User.findOne({ email: token });

    let memoryContext = "";
    if (user?.memory?.length) {
      memoryContext = user.memory.map(m =>
        `User: ${m.user}\nAI: ${m.ai}`
      ).join("\n");
    }

    let systemPrompt = "Create viral TikTok content.";
    if (mode === "story") systemPrompt = "Write cinematic story.";
    if (mode === "script") systemPrompt = "Write video script.";
    if (mode === "caption") systemPrompt = "Short viral captions.";
    if (mode === "ads") systemPrompt = "High converting ads.";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: memoryContext + "\n" + prompt }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response";

    if (user) {
      user.memory.push({ user: prompt, ai: content });
      if (user.memory.length > 10) user.memory.shift();
      await user.save();
    }

    res.json({ data: { content } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

// =====================================================
// 🖼️ IMAGE
// =====================================================

app.post("/generate-image", (req, res) => {
  const { prompt } = req.body;

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

  res.json({ data: { url } });
});

// =====================================================
// 🎬 VIDEO (RUNWAY)
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

  } catch (err) {
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
