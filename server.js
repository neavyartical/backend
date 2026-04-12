const express = require("express");

const app = express();

app.use(express.json());

// 🔥 ROOT ROUTE (THIS FIXES "NOT FOUND")
app.get("/", (req, res) => {
  res.send("✅ Backend is working perfectly");
});

// TEST API
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

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running...");
});
