import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import User from "./models/User.js";

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

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.json({ message: "User already exists" });

    const user = new User({
      email,
      password,
      credits: 999999, // 👑 YOU unlimited
      isAdmin: true
    });

    await user.save();
    res.json({ message: "Registered successfully" });

  } catch (err) {
    res.status(500).json({ message: "Register error" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.json({ message: "Invalid credentials" });
    }

    res.json({ user });

  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
});

/* ================= GENERATE ================= */
app.post("/generate", async (req, res) => {
  const { prompt, type, email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    // 💰 CREDIT SYSTEM
    if (!user.isAdmin) {
      if (user.credits <= 0) {
        return res.json({ error: "No credits left" });
      }

      user.credits -= 1;
      await user.save();
    }

    let story = "";
    let image = "";
    let video = "";

    /* STORY */
    if (type === "story" || type === "all") {
      story = `🔥 ${prompt}`;

      if (process.env.OPENROUTER_API_KEY) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
          })
        });

        const data = await response.json();
        story = data.choices?.[0]?.message?.content || story;
      }
    }

    /* IMAGE */
    if (type === "image" || type === "all") {
      image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    }

    res.json({ story, image, video });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation failed" });
  }
});

/* ================= ASK ================= */
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    let answer = question;

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: question }]
        })
      });

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || answer;
    }

    res.json({ answer });

  } catch (err) {
    res.status(500).json({ answer: "❌ AI error" });
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
