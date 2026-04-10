import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌:", err));

// ✅ Root
app.get("/", (req, res) => {
  res.send("ReelMind backend 🚀");
});

// ✅ TEST TOKEN (IMPORTANT)
app.get("/test-token", (req, res) => {
  try {
    const token = jwt.sign(
      { id: "admin" },
      process.env.JWT_SECRET || "fallbacksecret"
    );
    res.json({ token });
  } catch (err) {
    console.log("JWT ERROR:", err);
    res.status(500).json({ error: "JWT failed ❌" });
  }
});

// ✅ User Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// ✅ Register
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashed });

    await user.save();

    res.json({ message: "User registered ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Register failed ❌" });
  }
});

// ✅ Login
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
      process.env.JWT_SECRET || "fallbacksecret"
    );

    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed ❌" });
  }
});

// ✅ Start server
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
