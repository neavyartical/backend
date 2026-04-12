const express = require("express");

const app = express();

// Middleware
app.use(express.json());

// CORS (allow frontend)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// AI route
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ result: "Enter something." });
  }

  res.json({
    result: `✨ AI Result: ${prompt}`
  });
});

// ROOT (important for Render health)
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// 🔥 CRITICAL PART
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
