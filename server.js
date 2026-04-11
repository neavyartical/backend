const express = require("express");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());

// Serve frontend
app.use(express.static("public"));

// API (for your buttons)
app.post("/generate", (req, res) => {
  const { prompt, type } = req.body;

  if (!prompt) {
    return res.json({ result: "❌ Enter something first" });
  }

  if (type === "image") {
    return res.json({
      result: "https://picsum.photos/400/300"
    });
  }

  if (type === "story") {
    return res.json({
      result: `📖 Story: ${prompt} turned into something viral...`
    });
  }

  if (type === "video") {
    return res.json({
      result: `🎬 Video idea: Make a viral reel about "${prompt}".`
    });
  }

  res.json({
    result: `✨ AI Result: ${prompt}`
  });
});

// Always load frontend
app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running...");
});
