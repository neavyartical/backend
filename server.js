import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= HARD FIX JWT ================= */
const JWT_SECRET = "neavyartical_allahmystrenght_ultra_secure_1995";

/* ================= DEBUG ================= */
console.log("JWT HARD MODE ✅");

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* ================= TEST TOKEN ================= */
app.get("/test-token", (req, res) => {
  const token = jwt.sign(
    { id: "admin" },
    JWT_SECRET
  );

  res.json({ token });
});

/* ================= MONGO ================= */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌:", err));

/* ================= OPENAI ================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ================= MODEL ================= */
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
const User = mongoose.model("User", userSchema);

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) {
      return res.json({ error: "User already exists ❌" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed
    });

    await user.save();

    res.json({ message: "User registered ✅" });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.json({ error: "Register error ❌" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ error: "User not found ❌" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ error: "Wrong password ❌" });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET
    );

    res.json({ token });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.json({ error: "Login error ❌" });
  }
});

/* ================= GENERATE ================= */
app.post("/generate", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.json({ error: "No token ❌" });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.json({ error: "Invalid token ❌" });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ error: "No prompt ❌" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You create viral cinematic reel scripts with hooks, scenes and storytelling."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const result = completion.choices[0].message.content;

    res.json({ result });

  } catch (err) {
    console.log("AI ERROR:", err);
    res.json({ error: "AI error ❌" });
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running 🚀");
});
