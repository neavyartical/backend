const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

// Serve frontend
const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

// API test
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

// 🔥 LOAD FRONTEND AGAIN
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running...");
});
