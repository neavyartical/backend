require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ CONNECT MONGODB
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// ✅ USER MODEL
const User = mongoose.model("User", {
  email: String,
  password: String,
});

// 🔐 AUTH MIDDLEWARE
const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.json({ result: "Login first" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.json({ result: "Invalid token" });
  }
};

// ✅ REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    email,
    password: hashed
  });

  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ error: "User not found" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

// 🤖 GENERATE (PROTECTED)
app.post("/generate", auth, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ result: "Enter prompt" });
  }

  // TEMP RESPONSE (we add real AI next)
  res.json({
    result: "🔥 AI Response: " + prompt
  });
});

// 🚀 START SERVER
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
