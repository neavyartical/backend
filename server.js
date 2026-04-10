import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const JWT_SECRET = "neavyartical_allahmystrenght_ultra_secure_1995";

/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB ✅"))
  .catch(err => console.log(err));

/* ================= MODEL ================= */
const User = mongoose.model("User", new mongoose.Schema({
  email: String,
  password: String,
  credits: { type: Number, default: 10 },
  projects: [{
    title: String,
    content: String,
    video: String
  }]
}));

/* ================= AUTH ================= */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const exist = await User.findOne({ email });
  if (exist) return res.json({ error: "User exists" });

  const hash = await bcrypt.hash(password, 10);
  await new User({ email, password: hash }).save();

  res.json({ message: "Registered" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ error: "User not found" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);

  res.json({
    token,
    credits: user.credits,
    projects: user.projects
  });
});

/* ================= SAVE PROJECT ================= */
app.post("/save-project", async (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);

  const user = await User.findById(decoded.id);

  const { title, content, video } = req.body;

  user.projects.push({ title, content, video });
  await user.save();

  res.json({ projects: user.projects });
});

/* ================= TEXT ================= */
app.post("/generate", async (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);

  const { prompt } = req.body;

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3-8b-instruct",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await r.json();

  res.json({
    result: data.choices?.[0]?.message?.content || "AI error"
  });
});

/* ================= START ================= */
app.listen(5000, () => console.log("Server running 🚀"));
