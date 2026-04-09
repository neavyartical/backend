import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ROOT TEST
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// GENERATE (FAST TEST - NO AI)
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt received:", prompt);

  // 🔥 INSTANT RESPONSE (no waiting, no loop)
  res.json({
    video: "https://picsum.photos/500"
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log("🔥 BACKEND RUNNING");
});
