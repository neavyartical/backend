import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔥 ReelMind SAFE FULL BACKEND RUNNING 🔥");

/* ================= JWT ================= */
const JWT_SECRET = "neavyartical_allahmystrenght_ultra_secure_1995";

/* ================= DEBUG ================= */
console.log("MONGO:", process.env.MONGO_URL ? "OK ✅" : "MISSING ❌");
console.log("OPENROUTER:", process.env.OPENROUTER_API_KEY ? "OK ✅" : "MISSING ❌");

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* ================= MONGO ================= */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌:", err));

/* ================= MODEL ================= */
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  credits: { type: Number, default: 10 },
  lastReset: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.json({ error: "User exists ❌" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashed });
    await user.save();

    res.json({ message: "Registered ✅" });

  } catch {
    res.json({ error: "Register error ❌" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ error: "User not found ❌" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ error: "Wrong password ❌" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({
      token,
      credits: user.credits,
      isPremium: user.isPremium
    });

  } catch {
    res.json({ error: "Login error ❌" });
  }
});

/* ================= GENERATE ================= */
app.post("/generate", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.json({ error: "No token ❌" });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.json({ error: "Invalid token ❌" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.json({ error: "User not found ❌" });

    // 🔁 DAILY RESET
    const now = new Date();
    const diff = (now - new Date(user.lastReset)) / (1000 * 60 * 60);

    if (diff >= 24) {
      user.credits = 10;
      user.lastReset = now;
      await user.save();
    }

    // 🚨 CREDIT CHECK (skip if premium)
    if (!user.isPremium && user.credits <= 0) {
      return res.json({ error: "No credits left ❌" });
    }

    const { prompt } = req.body;
    if (!prompt) return res.json({ error: "No prompt ❌" });

    // 🔥 OPENROUTER AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: "Create viral cinematic reel scripts with hook, scenes and storytelling."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices) {
      console.log(data);
      return res.json({ error: "AI failed ❌" });
    }

    // ➖ DEDUCT CREDIT (only if not premium)
    if (!user.isPremium) {
      user.credits -= 1;
      await user.save();
    }

    res.json({
      result: data.choices[0].message.content,
      credits: user.credits,
      isPremium: user.isPremium
    });

  } catch (err) {
    console.log(err);
    res.json({ error: "Generation failed ❌" });
  }
});

/* ================= MOCK PLANS (SAFE) ================= */
/* These simulate Stripe so app never breaks */

app.post("/buy-plan", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, JWT_SECRET);

    const { plan } = req.body;
    const user = await User.findById(decoded.id);

    if (plan === "basic") user.credits += 100;
    if (plan === "pro") user.credits += 300;
    if (plan === "ultimate") user.credits += 1000;

    await user.save();

    res.json({ credits: user.credits });

  } catch {
    res.json({ error: "Plan purchase failed ❌" });
  }
});

/* ================= MOCK PREMIUM ================= */

app.post("/go-premium", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);

    user.isPremium = true;
    await user.save();

    res.json({ message: "Premium activated 🔥" });

  } catch {
    res.json({ error: "Premium failed ❌" });
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running 🚀");
});
