import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json());

// ✅ MONGODB CONNECTION
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌:", err));

// ✅ ROOT ROUTE
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// ✅ USER SCHEMA
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// ✅ REGISTER
app.post("/register", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields ❌" });
    }

    // check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists ❌" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email: email,
      password: hashed
    });

    await user.save();

    res.json({ message: "User registered ✅" });

  } catch (err) {
    console.log("Register error:", err);
    res.status(500).json({ error: "Register failed ❌" });
  }
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found ❌" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Wrong password ❌" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.json({ token });

  } catch (err) {
    console.log("Login error:", err);
    res.status(500).json({ error: "Login failed ❌" });
  }
});

// ✅ GENERATE (PROTECTED)
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

    // 🔥 AI REQUEST
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    const result =
      data.choices?.[0]?.message?.content ||
      "No response";

    res.json({ result });

  } catch (err) {
    console.log("Generate error:", err);
    res.status(500).json({ error: "AI failed ❌" });
  }
});

// ✅ START SERVER
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
