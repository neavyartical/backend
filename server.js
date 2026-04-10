import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ROOT
app.get("/", (req, res) => {
  res.send("NEW VERSION 🚀");
});

// FORCE TEST ROUTE
app.get("/test-token", (req, res) => {
  console.log("ROUTE HIT ✅");

  return res.json({
    message: "route works",
    token: "test123"
  });
});

// START
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
