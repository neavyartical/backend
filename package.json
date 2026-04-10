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

console.log("🔥 FINAL FREE AI VERSION RUNNING 🔥");

/* 🔐 JWT */
const JWT_SECRET = "neavyartical_allahmystrenght_ultra_secure_1995";

/* ROOT */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀 (FREE AI)");
});

/* TEST TOKEN */
app.get("/test-token", (req, res) => {
  const token = jwt.sign({ id: "admin" }, JWT_SECRET);
  res.json({ token });
});

/* MONGO */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌:", err));

/* USER MODEL */
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
const User = mongoose.model("User", userSchema);

/* REGISTER */
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.json({ error: "User exists ❌" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashed });
    await user.save();

    res.json({ message: "Registered ✅" });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.json({ error: "Register error ❌" });
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ error: "User not found ❌" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ error: "Wrong password ❌" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({ token });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.json({ error: "Login error ❌" });
  }
});

/* GENERATE (HUGGING FACE - FREE) */
app.post("/generate", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) return res.json({ error: "No token ❌" });

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.json({ error: "Invalid token ❌" });
    }

    const { prompt } = req.body;
    if (!prompt) return res.json({ error: "No prompt ❌" });

    console.log("🧠 Prompt:", prompt);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/bigscience/bloom",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `Create a viral cinematic reel script with hook, scenes and storytelling:\n${prompt}`
        })
      }
    );

    const data = await response.json();

    let result = "";

    if (Array.isArray(data)) {
      result = data[0]?.generated_text || "No result";
    } else if (data.error) {
      result = data.error;
    } else {
      result = JSON.stringify(data);
    }

    res.json({ result });

  } catch (err) {
    console.log("HF ERROR:", err);
    res.json({ error: "Free AI error ❌" });
  }
});

/* START */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running 🚀");
});
