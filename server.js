const express = require("express");
const path = require("path");

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Define public folder path
const publicPath = path.join(__dirname, "public");

// ✅ Serve static files (HTML, CSS, JS)
app.use(express.static(publicPath));

// ✅ API route (test)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK 🚀" });
});

// ✅ AI route (for your buttons)
app.post("/generate", (req, res) => {
  const { prompt, type } = req.body;

  if (!prompt) {
    return res.json({ result: "❌ Please enter something first" });
  }

  if (type === "story") {
    return res.json({
      result: `📖 Story: ${prompt} became a viral story...`
    });
  }

  if (type === "image") {
    return res.json({
      result: `🖼 Image idea for: ${prompt}`
    });
  }

  if (type === "video") {
    return res.json({
      result: `🎬 Video idea: Make a viral reel about "${prompt}"`
    });
  }

  res.json({
    result: `✨ AI Result: ${prompt}`
  });
});

// ✅ ALWAYS load frontend (VERY IMPORTANT)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
