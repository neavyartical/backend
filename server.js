const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Define public folder
const publicPath = path.join(__dirname, "public");

// ✅ Serve frontend files (VERY IMPORTANT)
app.use(express.static(publicPath));

// ✅ Test API route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK 🚀" });
});

// ✅ AI route (connects to frontend buttons)
app.post("/generate", (req, res) => {
  const { prompt, type } = req.body;

  if (!prompt) {
    return res.json({ result: "❌ Enter something first" });
  }

  if (type === "story") {
    return res.json({
      result: `📖 Story: ${prompt} turned into something viral...`
    });
  }

  if (type === "image") {
    return res.json({
      result: `🖼 Image idea: ${prompt}`
    });
  }

  if (type === "video") {
    return res.json({
      result: `🎬 Video idea: Make a viral reel about "${prompt}".`
    });
  }

  return res.json({
    result: `✨ AI Result: ${prompt}`
  });
});

// ✅ ALWAYS load frontend (fixes "Not Found")
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
