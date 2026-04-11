const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Serve frontend (VERY IMPORTANT)
app.use(express.static(path.join(__dirname, "public")));

// ✅ API route (test)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK 🚀" });
});

// ✅ Example AI route (so your buttons work)
app.post("/generate", (req, res) => {
  const { prompt, type } = req.body;

  if (!prompt) {
    return res.json({ result: "❌ No prompt provided" });
  }

  if (type === "image") {
    return res.json({
      result: "https://picsum.photos/400/300"
    });
  }

  if (type === "story") {
    return res.json({
      result: `📖 Story: Once upon a time, ${prompt} became a viral sensation...`
    });
  }

  if (type === "video") {
    return res.json({
      result: `🎬 Video idea: Create a cinematic reel about "${prompt}" with trending music.`
    });
  }

  res.json({
    result: `✨ AI Result: "${prompt}" is a powerful idea that can go viral!`
  });
});

// ✅ Default route (VERY IMPORTANT)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
