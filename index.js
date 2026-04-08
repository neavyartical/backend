import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/test", (req, res) => {
  console.log("✅ TEST HIT");
  res.json({ message: "Backend working ✅" });
});

// GENERATE ROUTE (TEMP SIMPLE)
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt received:", prompt);

  // TEMP FAKE RESPONSE (to confirm working)
  res.json({
    video: "https://www.w3schools.com/html/mov_bbb.mp4"
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log("🔥 BACKEND RUNNING");
  console.log("🚀 Server on port", PORT);
});
