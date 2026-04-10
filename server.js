import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Mongo (optional but safe)
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌", err));

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// ✅ TEST TOKEN (THIS IS WHAT YOU WANT)
app.get("/test-token", (req, res) => {
  if (!process.env.JWT_SECRET) {
    return res.send("JWT missing ❌");
  }

  const token = jwt.sign(
    { id: "admin123" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

// ✅ START
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
