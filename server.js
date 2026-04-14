// ===== IMPORTS =====
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fetch = require("node-fetch");
const mongoose = require("mongoose");

// ===== INIT =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE CONNECTION =====
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

// ===== SOCKET REALTIME =====
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);
});

// =====================================================
// 🔐 AUTH SYSTEM
// =====================================================

// LOGIN
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
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET USER
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
// 📱 FEED SYSTEM
// =====================================================

// CREATE POST
app.post("/post", async (req, res) => {
  try {
    const { content, type } = req.body;

    if (!content || !type) {
      return res.status(400).json({ error: "Invalid post" });
    }

    const newPost = await Post.create({ content, type });

    io.emit("new_post", newPost);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Post failed" });
  }
});

// GET FEED
app.get("/feed", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({ data: posts });

  } catch (err) {
    res.status(500).json({ error: "Feed failed" });
  }
});

// LIKE
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
// 🤖 AI SYSTEM (MODES + MEMORY)
// =====================================================

app.post("/generate-text", async (req, res) => {
  try {
    const { prompt, mode } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const token = req.headers.authorization?.split(" ")[1];
    const user = await User.findOne({ email: token });

    // ===== MEMORY CONTEXT =====
    let memoryContext = "";
    if (user?.memory?.length) {
      memoryContext = user.memory
        .map(m => `User: ${m.user}\nAI: ${m.ai}`)
        .join("\n");
    }

    // ===== MODES =====
    let systemPrompt = "";

    switch (mode) {
      case "story":
        systemPrompt = "Write a cinematic emotional story.";
        break;
      case "script":
        systemPrompt = "Write a professional video script with scenes.";
        break;
      case "caption":
        systemPrompt = "Generate short viral captions.";
        break;
      case "ads":
        systemPrompt = "Write high converting ad copy.";
        break;
      default:
        systemPrompt = `
Create viral TikTok content:

Hook:
Content:
Caption:
Hashtags:
`;
    }

    // ===== AI CALL =====
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

    // ===== SAVE MEMORY =====
    if (user) {
      user.memory.push({ user: prompt, ai: content });

      if (user.memory.length > 10) user.memory.shift();

      await user.save();
    }

    res.json({ data: { content } });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

// =====================================================
// 🖼️ IMAGE AI
// =====================================================

app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    res.json({ data: { url } });

  } catch (err) {
    res.status(500).json({ error: "Image failed" });
  }
});

// =====================================================
// 🎬 VIDEO AI (RUNWAY READY)
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
      body: JSON.stringify({
        prompt,
        seconds: 5
      })
    });

    const data = await response.json();

    res.json({
      data: {
        url: data.output?.video_url || "Processing..."
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Video failed" });
  }
});

// =====================================================
// 🔴 LIVE STREAM READY
// =====================================================

app.get("/live", (req, res) => {
  res.send("🔴 Live streaming ready");
});

// =====================================================
// ❤️ HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.send("🚀 ReelMind Backend LIVE");
});

// =====================================================
// 🚀 START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
