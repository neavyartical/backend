import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("NEW VERSION 🚀");
});

app.get("/test-token", (req, res) => {
  const token = jwt.sign(
    { id: "admin123" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
