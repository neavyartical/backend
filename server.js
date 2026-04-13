const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// FETCH FIX (Render safe)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ================= INIT =================
const app = express();
app.use(express.json());
app.use(cors());

// ================= ENV =================
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
        messages: [
          {
            role: "system",
            content: "You are ReelMind AI. Answer clearly and intelligently."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    console.log("AI RESPONSE:", data);

    if (data.error) {
      return res.json({ result: "AI Error: " + data.error.message });
    }

    const result =
      data?.choices?.[0]?.message?.content || "No response from AI";

    res.json({ result });

  } catch (err) {
    console.log(err);
    res.json({ result: "Server error" });
  }
});

// ================= IMAGE =================
app.post("/image", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.json({ error: "No prompt" });

  try {
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    res.json({
      image: imageUrl
    });

  } catch (err) {
    console.log(err);
    res.json({ error: "Image failed" });
  }
});

// ================= VIDEO =================
app.post("/video-edit", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    edit: "AI edited video based on: " + prompt
  });
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

  res.json({
    users,
    projects,
    note: "Revenue tracked via external dashboard"
  });
});

// ================= ADS =================
app.get("/ads.txt", (req, res) => {
  res.send("google.com, pub-1714638410489429, DIRECT, f08c47fec0942fa0");
});

// ================= REQUIRED PAGES =================
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
  res.send("<h1>Blog</h1><p>AI content and updates.</p>");
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Running");
});

// ================= START =================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
