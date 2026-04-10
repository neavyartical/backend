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

/* ================= MONGO ================= */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌:", err));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
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

    const user = new User({ email, password: hashed });
    await user.save();

    res.json({ message: "Registered successfully ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Register error ❌" });
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
      process.env.JWT_SECRET
    );

    res.json({ token });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login error ❌" });
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
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.json({ error: "Invalid token ❌" });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ error: "No prompt ❌" });
    }

    // 🔥 MOCK AI (NO API NEEDED — ALWAYS WORKS)
    const result = `🎬 AI Script:\n\n"${prompt}"\n\n🔥 This would be a viral cinematic reel idea with engaging scenes, dramatic transitions and storytelling.`

    res.json({ result });

  } catch (err) {
    console.log(err);
    res.json({ error: "Server error ❌" });
  }
});

/* ================= TEST TOKEN ================= */
app.get("/test-token", (req, res) => {
  const token = jwt.sign(
    { id: "admin" },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running 🚀");
});
