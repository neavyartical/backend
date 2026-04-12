const express = require("express");

const app = express();

// Middleware
app.use(express.json());

// 🔥 Allow GitHub frontend to connect (CORS)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// ✅ AI route
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ result: "Please enter something." });
  }

  res.json({
    result: `✨ AI Result: ${prompt}`
  });
});

// ✅ Health / root check
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running...");
});
