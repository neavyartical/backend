import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Debug ENV
console.log("MONGO_URL:", process.env.MONGO_URL ? "OK" : "MISSING");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "OK" : "MISSING");

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo ERROR ❌", err));

// ✅ Root
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// ✅ User Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// ✅ Register
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields ❌" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User exists ❌" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });

    await user.save();

    res.json({ message: "User registered ✅" });

  } catch (err) {
    console.log("REGISTER ERROR ❌", err);
    res.status(500).json({ error: "Register failed ❌" });
  }
});

// ✅ Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields ❌" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found ❌" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Wrong password ❌" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT missing ❌" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {
    console.log("LOGIN ERROR ❌", err);
    res.status(500).json({ error: "Login failed ❌" });
  }
});

// ✅ Generate (Protected AI)
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
    console.log("GENERATE ERROR ❌", err);
    res.status(500).json({ error: "AI failed ❌" });
  }
});

// ✅ 🔥 TEST TOKEN ROUTE (NO LOGIN NEEDED)
app.get("/test-token", (req, res) => {
  const token = jwt.sign(
    { id: "admin123", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

// ✅ Start Server
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
