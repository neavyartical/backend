const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Serve static frontend
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// ✅ API route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK 🚀" });
});

// ✅ AI route
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

// ✅ FORCE frontend for ALL routes (VERY IMPORTANT)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server stable on port ${PORT}`);
});
