import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ CHECK ENV
console.log("JWT:", process.env.JWT_SECRET ? "OK" : "MISSING");

// ✅ CONNECT MONGO
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌", err));

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// ✅ TEST TOKEN (NO LOGIN NEEDED)
app.get("/test-token", (req, res) => {
  const token = jwt.sign(
    { id: "admin123" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

// ✅ START SERVER (ALWAYS LAST)
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
