const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// FETCH FIX (Render safe)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(cors());

// ENV
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI || "";

// CONNECT DB (SAFE)
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DB Connected"))
    .catch(err => console.log("❌ DB Error:", err));
} else {
  console.log("⚠️ No Mongo URI (running without DB)");
}

// MODELS
const User = mongoose.model("User", {
  email: String,
  password: String
});

const Project = mongoose.model("Project", {
  userId: String,
  content: String,
  type: String,
  createdAt: { type: Date, default: Date.now }
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
    return res.status(401).send("Invalid token");
  }
}

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

  if (!user) return res.json({ msg: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// AI TEXT (WORKING WITHOUT API)
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.json({ result: "Enter something" });

  return res.json({
    result: "🔥 AI response: " + prompt
  });
});

// IMAGE (WORKING PLACEHOLDER)
app.post("/image", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    image: "https://via.placeholder.com/512?text=" + encodeURIComponent(prompt)
  });
});

// VIDEO EDIT
app.post("/video-edit", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    edit: "🎬 AI edited video: " + prompt
  });
});

// SAVE
app.post("/save", auth, async (req, res) => {
  const { content, type } = req.body;

  await new Project({
    userId: req.userId,
    content,
    type
  }).save();

  res.json({ msg: "Saved" });
});

// LOAD
app.get("/projects", auth, async (req, res) => {
  const projects = await Project.find({ userId: req.userId });
  res.json(projects);
});

// ADMIN
app.get("/admin", async (req, res) => {
  const users = await User.countDocuments();
  const projects = await Project.countDocuments();

  res.json({ users, projects });
});

// REQUIRED PAGES
app.get("/privacy", (req, res) => {
  res.send("<h1>Privacy Policy</h1><p>Your data is safe.</p>");
});

app.get("/about", (req, res) => {
  res.send("<h1>About</h1><p>ReelMind AI by Artical Neavy</p>");
});

app.get("/contact", (req, res) => {
  res.send("<h1>Contact</h1><p>Email: support@reelmind.ai</p>");
});

app.get("/blog", (req, res) => {
  res.send("<h1>Blog</h1><p>AI content coming soon</p>");
});

// ADSENSE
app.get("/ads.txt", (req, res) => {
  res.send("google.com, pub-1714638410489429, DIRECT, f08c47fec0942fa0");
});

// ROOT
app.get("/", (req, res) => {
  res.send("🚀 Backend running");
});

// START
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🔥 Running on " + PORT));
