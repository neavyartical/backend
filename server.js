// 🔥 IMPORTS
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

// ✅ FETCH FIX (Node <18)
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// 🔥 APP INIT
const app = express();
app.use(express.json());

// 🔐 ENV
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;

// 🔥 CONNECT DB (FIXED)
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

// 👤 USER
const User = mongoose.model("User", {
  email: String,
  password: String
});

// 💾 PROJECT
const Project = mongoose.model("Project", {
  userId: String,
  content: String,
  type: String
});

// ================= AUTH =================

// 🔐 REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });

  await user.save();
  res.json({ msg: "Registered" });
});

// 🔐 LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ msg: "No user" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// 🔒 AUTH MIDDLEWARE
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

// ================= SOCIAL LOGIN =================

// GOOGLE
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    let user = await User.findOne({ email });

    if (!user) {
      user = await new User({ email, password: "google_auth" }).save();
    }

    const jwtToken = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token: jwtToken });

  } catch {
    res.status(401).json({ error: "Google login failed" });
  }
});

// FACEBOOK
app.post("/auth/facebook", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await new User({ email, password: "facebook_auth" }).save();
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// APPLE
app.post("/auth/apple", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await new User({ email, password: "apple_auth" }).save();
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// ================= AI =================

// 🧠 TEXT AI
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.json({ result: "Enter something." });

  try {
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

    return res.json({
      result: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.log(err);
    return res.json({ result: "AI error" });
  }
});

// 🎨 IMAGE (READY)
app.post("/image", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    image: "https://via.placeholder.com/512?text=AI+Image",
    prompt
  });
});

// 🎬 VIDEO (READY FOR RUNWAY)
app.post("/video", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    video: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    idea: prompt
  });
});

// ================= PROJECT =================

// 💾 SAVE
app.post("/save", auth, async (req, res) => {
  const { content, type } = req.body;

  const project = new Project({
    userId: req.userId,
    content,
    type
  });

  await project.save();
  res.json({ msg: "Saved" });
});

// 📂 LOAD
app.get("/projects", auth, async (req, res) => {
  const projects = await Project.find({ userId: req.userId });
  res.json(projects);
});

// ================= ADS =================

// ADSENSE VERIFY
app.get("/ads.txt", (req, res) => {
  res.send("google.com, pub-xxxxxxxxxxxx, DIRECT, f08c47fec0942fa0");
});

// ================= ROOT =================

app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Running");
});

// ================= PORT =================

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
