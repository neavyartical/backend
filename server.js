const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// Fetch fix for node-fetch (Render safe)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// App init
const app = express();
app.use(express.json());
app.use(cors());

// Env variables
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// MongoDB connection
if (!MONGO_URI) {
  console.log("❌ MONGO_URI missing — server will not start");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.log("❌ DB Error:", err.message));

// Models
const User = mongoose.model("User", {
  email: String,
  password: String
});

const Project = mongoose.model("Project", {
  userId: String,
  content: String,
  type: String
});

// Routes
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend is running");
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed
    });

    res.json({ message: "User created", user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate AI text (OpenRouter)
app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OpenRouter API key" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save project
app.post("/save", async (req, res) => {
  try {
    const { userId, content, type } = req.body;

    const project = await Project.create({
      userId,
      content,
      type
    });

    res.json(project);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
