const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ fetch fix (Render safe)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());

// 🔐 ENV
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🔥 DB CONNECT
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// 🌐 CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// ================= MODELS =================

const User = mongoose.model("User", {
  email: String,
  password: String,
  plan: { type: String, default: "free" } // monetization ready
});

const Project = mongoose.model("Project", {
  userId: String,
  content: String,
  type: String,
  createdAt: { type: Date, default: Date.now }
});

// ================= AUTH =================

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  await new User({ email, password: hashed }).save();

  res.json({ msg: "Registered" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ msg: "No user" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// AUTH
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// ================= AI CORE =================

// 🧠 TEXT AI (FAST + SMART)
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.json({ result: "Enter something." });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are ReelMind AI created by Artical Neavy. You answer like ChatGPT + Google + Wikipedia combined. Be smart, fast, and helpful."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    res.json({
      result: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.log(err);
    res.json({ result: "AI error" });
  }
});

// 🎨 IMAGE GENERATION (REAL)
app.post("/image", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    res.json({
      image: `data:image/png;base64,${base64}`,
      watermark: "ReelMind AI • Artical Neavy"
    });

  } catch (err) {
    console.log(err);
    res.json({ error: "Image generation failed" });
  }
});

// 🎬 VIDEO (READY FOR RUNWAY)
app.post("/video", async (req, res) => {
  const { prompt } = req.body;

  // 🔥 replace later with runway API
  res.json({
    video: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    note: "Connect Runway here"
  });
});

// ================= STORAGE =================

// SAVE PROJECT
app.post("/save", auth, async (req, res) => {
  const { content, type } = req.body;

  await new Project({
    userId: req.userId,
    content,
    type
  }).save();

  res.json({ msg: "Saved" });
});

// LOAD PROJECTS
app.get("/projects", auth, async (req, res) => {
  const projects = await Project.find({ userId: req.userId });
  res.json(projects);
});

// ================= SYSTEM =================

// TERMS (for AdSense approval)
app.get("/terms", (req, res) => {
  res.send("Terms and Conditions - ReelMind AI by Artical Neavy");
});

// ROOT (IMPORTANT)
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Running");
});

// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Running on " + PORT));
