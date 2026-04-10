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

// ✅ DEBUG: check env
console.log("MONGO_URL:", process.env.MONGO_URL ? "Loaded ✅" : "Missing ❌");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Loaded ✅" : "Missing ❌");

// ✅ MONGO CONNECT (FULL ERROR LOG)
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => {
    console.log("❌ MongoDB ERROR:");
    console.log(err);
  });

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// ✅ USER MODEL
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// ✅ REGISTER (FULL DEBUG)
app.post("/register", async (req, res) => {
  try {
    console.log("Register request:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing fields");
      return res.status(400).json({ error: "Missing fields ❌" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      console.log("❌ User exists");
      return res.status(400).json({ error: "User already exists ❌" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed
    });

    await user.save();

    console.log("✅ User saved");

    res.json({ message: "User registered ✅" });

  } catch (err) {
    console.log("❌ REGISTER ERROR:");
    console.log(err);
    res.status(500).json({ error: "Register failed ❌" });
  }
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  try {
    console.log("Login request:", req.body);

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ error: "User not found ❌" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      console.log("❌ Wrong password");
      return res.status(400).json({ error: "Wrong password ❌" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    console.log("✅ Login success");

    res.json({ token });

  } catch (err) {
    console.log("❌ LOGIN ERROR:");
    console.log(err);
    res.status(500).json({ error: "Login failed ❌" });
  }
});

// ✅ GENERATE
app.post("/generate", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: "No token ❌" });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token ❌" });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt ❌" });
    }

    console.log("AI prompt:", prompt);

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

    console.log("AI response:", data);

    const result =
      data.choices?.[0]?.message?.content ||
      "No response";

    res.json({ result });

  } catch (err) {
    console.log("❌ GENERATE ERROR:");
    console.log(err);
    res.status(500).json({ error: "AI failed ❌" });
  }
});

// ✅ START
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
