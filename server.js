import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================== MONGO ================== */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌", err));

/* ================== USER MODEL ================== */
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

/* ================== ROOT ================== */
app.get("/", (req, res) => {
  res.send("ReelMind Backend 🚀");
});

/* ================== REGISTER ================== */
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashed });
    await user.save();

    res.json({ message: "User registered ✅" });
  } catch (err) {
    res.status(500).json({ error: "Register failed ❌" });
  }
});

/* ================== LOGIN ================== */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found ❌" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Wrong password ❌" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed ❌" });
  }
});

/* ================== TEST TOKEN ================== */
app.get("/test-token", (req, res) => {
  const token = jwt.sign(
    { id: "admin123" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

/* ================== PROTECTED ROUTE ================== */
app.post("/generate", (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token ❌" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    const { prompt } = req.body;

    // 👉 Replace this later with OpenAI API
    res.json({
      result: `Generated content for: ${prompt}`
    });

  } catch (err) {
    res.status(401).json({ error: "Invalid token ❌" });
  }
});

/* ================== START ================== */
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
