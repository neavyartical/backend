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

const JWT_SECRET = "neavyartical_allahmystrenght_ultra_secure_1995";

/* ================= MONGO ================= */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));

/* ================= MODEL ================= */
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  credits: { type: Number, default: 10 },
  lastReset: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);

/* ================= AUTH ================= */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const exist = await User.findOne({ email });
  if (exist) return res.json({ error: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });
  await user.save();

  res.json({ message: "Registered" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);

  res.json({
    token,
    credits: user.credits,
    isPremium: user.isPremium
  });
});

/* ================= DAILY RESET ================= */
async function checkReset(user) {
  const now = new Date();
  const diff = (now - new Date(user.lastReset)) / (1000 * 60 * 60);

  if (diff >= 24) {
    user.credits = 10;
    user.lastReset = now;
    await user.save();
  }
}

/* ================= TEXT GENERATION ================= */
app.post("/generate", async (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);

  await checkReset(user);

  if (!user.isPremium && user.credits <= 0) {
    return res.json({ error: "No credits" });
  }

  const { prompt } = req.body;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3-8b-instruct",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();

  if (!user.isPremium) {
    user.credits -= 1;
    await user.save();
  }

  res.json({
    result: data.choices?.[0]?.message?.content || "AI error",
    credits: user.credits
  });
});

/* ================= IMAGE GENERATION (REAL) ================= */
app.post("/generate-image", async (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);

  await checkReset(user);

  if (!user.isPremium && user.credits <= 0) {
    return res.json({ error: "No credits" });
  }

  const { prompt } = req.body;

  // 🔥 FREE IMAGE API (Pollinations)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

  if (!user.isPremium) {
    user.credits -= 2;
    await user.save();
  }

  res.json({
    image: imageUrl,
    credits: user.credits
  });
});

/* ================= VIDEO GENERATION (READY) ================= */
app.post("/generate-video", async (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);

  await checkReset(user);

  if (!user.isPremium && user.credits <= 0) {
    return res.json({ error: "No credits" });
  }

  const { prompt } = req.body;

  // ⚠️ Real API placeholder
  const video = `
🎬 Video storyboard:
- Scene 1: ${prompt}
- Scene 2: Cinematic twist
- Scene 3: Viral ending

(Connect Runway/Pika API later)
`;

  if (!user.isPremium) {
    user.credits -= 3;
    await user.save();
  }

  res.json({
    video,
    credits: user.credits
  });
});

/* ================= PLANS ================= */
app.post("/buy-plan", async (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);

  const user = await User.findById(decoded.id);

  const { plan } = req.body;

  if (plan === "basic") user.credits += 100;
  if (plan === "pro") user.credits += 300;
  if (plan === "ultimate") user.credits += 1000;

  await user.save();

  res.json({ credits: user.credits });
});

/* ================= PREMIUM ================= */
app.post("/go-premium", async (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);

  const user = await User.findById(decoded.id);

  user.isPremium = true;
  await user.save();

  res.json({ message: "Premium activated" });
});

/* ================= START ================= */
app.listen(5000, () => console.log("Server running 🚀"));
