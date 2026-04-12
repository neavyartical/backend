const express = require("express");

const app = express();

// Middleware
app.use(express.json());

// Test API
app.get("/api/health", (req, res) => {
  res.json({ status: "OK 🚀" });
});

// AI route
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ result: "❌ Enter something first" });
  }

  res.json({
    result: `✨ AI Result: ${prompt}`
  });
});

// 🔥 TEMP TEST (NO FRONTEND)
app.get("/", (req, res) => {
  res.send("✅ Backend is working perfectly");
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
