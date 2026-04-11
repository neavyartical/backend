import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* CONNECT DATABASE */
connectDB();

const PORT = process.env.PORT || 3000;

/* 👑 OWNER EMAIL */
const OWNER_EMAIL = "artical@example.com";

/* ROOT CHECK */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* =========================
   🔐 REGISTER / LOGIN
========================= */
app.post("/register", async (req, res) => {
  try {
    const { email } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        credits: email === OWNER_EMAIL ? 999999 : 10,
        isOwner: email === OWNER_EMAIL
      });
    }

    res.json({
      credits: user.isOwner ? "unlimited" : user.credits,
      isOwner: user.isOwner
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

/* =========================
   💰 USE CREDIT
========================= */
app.post("/use-credit", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ error: "User not found" });

    if (user.isOwner || user.subscription === "pro") {
      return res.json({ credits: "unlimited" });
    }

    if (user.credits <= 0) {
      return res.json({ error: "No credits left" });
    }

    user.credits -= 1;
    await user.save();

    res.json({ credits: user.credits });

  } catch (error) {
    console.error("Credit error:", error);
    res.status(500).json({ error: "Credit system failed" });
  }
});

/* =========================
   🎬 GENERATE (SMART MODE)
========================= */
app.post("/generate", async (req, res) => {
  try {
    const { prompt, mode = "story" } = req.body;

    let story = "";
    let image = "";
    let video = "";

    /* STORY ONLY */
    if (mode === "story") {
      story = `🔥 ${prompt}`;

      if (process.env.OPENROUTER_API_KEY) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              { role: "user", content: `Write a cinematic story: ${prompt}` }
            ]
          })
        });

        const data = await response.json();
        story = data.choices?.[0]?.message?.content || story;
      }
    }

    /* IMAGE ONLY */
    else if (mode === "image") {
      image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;
    }

    /* VIDEO ONLY (SAFE FOR NOW) */
    else if (mode === "video") {
      video = "";
    }

    /* ALL */
    else if (mode === "all") {
      story = `🔥 ${prompt}`;
      image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;
    }

    res.json({ story, image, video });

  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({
      story: "❌ Generation failed",
      image: "",
      video: ""
    });
  }
});

/* =========================
   🌍 ASK (GOOGLE-LIKE AI)
========================= */
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    let answer = question;

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

  } catch (error) {
    console.error("Ask error:", error);
    res.status(500).json({ answer: "❌ AI not responding" });
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
