import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import connectDB from "./db.js";
import User from "./models/User.js";
import auth from "./middleware/auth.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ROOT */
app.get("/", (req, res) => {
  res.send("🚀 ReelMind Backend Running");
});

/* REGISTER */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const exist = await User.findOne({ email });
    if (exist) return res.json({ message: "User exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hash,
      credits: 999999, // 👑 you unlimited
      isAdmin: true
    });

    await user.save();
    res.json({ message: "Registered" });

  } catch {
    res.status(500).json({ message: "Error" });
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ message: "Invalid login" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET
    );

    res.json({ token, user });

  } catch {
    res.status(500).json({ message: "Login error" });
  }
});

/* DASHBOARD */
app.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
});

/* GENERATE */
app.post("/generate", auth, async (req, res) => {
  const { prompt, type } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user.isAdmin) {
      if (user.credits <= 0) {
        return res.json({ error: "No credits" });
      }
      user.credits--;
      await user.save();
    }

    let story = "", image = "";

    if (type === "story" || type === "all") {
      story = `🔥 ${prompt}`;
    }

    if (type === "image" || type === "all") {
      image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    }

    res.json({ story, image });

  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

/* ASK */
app.post("/ask", auth, async (req, res) => {
  const { question } = req.body;
  res.json({ answer: `🌍 ${question}` });
});

/* START */
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
