const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Public folder (IMPORTANT)
const publicPath = path.resolve(__dirname, "public");

// ✅ Serve frontend files
app.use(express.static(publicPath));

// ✅ API test route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK 🚀" });
});

// ✅ AI route
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

// ✅ FORCE FRONTEND (THIS IS THE KEY FIX)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
