// ================= IMPORTS =================
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// FETCH FIX
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ================= APP =================
const app = express();
app.use(express.json());
app.use(cors());

// ================= ENV =================
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

// ================= DB =================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// ================= MODELS =================
const User = mongoose.model("User", {
  email: String,
  password: String
});

const Project = mongoose.model("Project", {
  userId: String,
  content: String,
  type: String
});

// ================= AUTH =================
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

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  await new User({ email, password: hashed }).save();

  res.json({ msg: "Registered" });
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ msg: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// ================= AI TEXT =================
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.json({ result: "Enter something" });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
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

// ================= IMAGE =================
app.post("/image", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    res.json({
      image: `data:image/png;base64,${base64}`
    });

  } catch {
    res.json({ error: "Image failed" });
  }
});

// ================= VIDEO =================
app.post("/video-edit", (req, res) => {
  const { prompt } = req.body;
  res.json({ edit: "Video edited: " + prompt });
});

// ================= SAVE =================
app.post("/save", auth, async (req, res) => {
  const { content, type } = req.body;

  await new Project({
    userId: req.userId,
    content,
    type
  }).save();

  res.json({ msg: "Saved" });
});

// ================= LOAD =================
app.get("/projects", auth, async (req, res) => {
  const projects = await Project.find({ userId: req.userId });
  res.json(projects);
});

// ================= ADMIN =================
app.get("/admin", async (req, res) => {
  const users = await User.countDocuments();
  const projects = await Project.countDocuments();

  res.json({ users, projects });
});

// ================= PAGES =================
app.get("/privacy", (req, res) => {
  res.send("Privacy Policy");
});

app.get("/about", (req, res) => {
  res.send("About ReelMind AI");
});

app.get("/contact", (req, res) => {
  res.send("Contact us");
});

app.get("/blog", (req, res) => {
  res.send("Blog page");
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ================= PORT =================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
