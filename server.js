import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   🔗 CONNECT MONGO
========================= */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌:", err));

/* =========================
   🏠 ROOT ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* =========================
   👤 USER MODEL
========================= */
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

/* =========================
   📝 REGISTER
========================= */
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed
    });

    await user.save();

    res.json({ message: "User registered ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Register error ❌" });
  }
});

/* =========================
   🔐 LOGIN
========================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found ❌" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Wrong password ❌" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.json({ token });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login error ❌" });
  }
});

/* =========================
   🤖 GENERATE (AI)
========================= */
app.post("/generate", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: "No token ❌" });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid token ❌" });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt ❌" });
    }

    // 🔥 CALL OPENAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    console.log("AI RESPONSE:", data);

    if (!data.choices) {
      return res.status(500).json({
        error: "OpenAI error ❌",
        details: data
      });
    }

    res.json({
      result: data.choices[0].message.content
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ error: "Server crash ❌" });
  }
});

/* =========================
   🧪 TEST TOKEN ROUTE
========================= */
app.get("/test-token", (req, res) => {
  const token = jwt.sign(
    { id: "admin" },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT + " 🚀");
});
