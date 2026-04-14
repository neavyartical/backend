// ===== IMPORTS =====
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fetch = require("node-fetch");

// ===== INIT =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE (TEMP MEMORY) =====
let users = {};
let posts = [];
let idCounter = 1;

// ===== SOCKET =====
io.on("connection", () => {
  console.log("🟢 User connected");
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { email } = req.body;

  if (!users[email]) {
    users[email] = {
      email,
      credits: 1000,
      referrals: 0
    };
  }

  res.json({
    data: {
      token: email
    }
  });
});

// ===== GET USER =====
app.get("/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const user = users[token];

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ data: user });
});

// ===== CREATE POST =====
app.post("/post", (req, res) => {
  const { content, type } = req.body;

  const newPost = {
    id: idCounter++,
    content,
    type,
    likes: 0
  };

  posts.unshift(newPost);

  io.emit("new_post", newPost);

  res.json({ success: true });
});

// ===== GET FEED =====
app.get("/feed", (req, res) => {
  res.json({ data: posts });
});

// ===== LIKE =====
app.post("/like/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts.find(p => p.id === id);

  if (post) post.likes++;

  res.json({ success: true });
});

// =====================================================
// 🔥 REAL AI SECTION (STRICT MODE)
// =====================================================

// ===== TEXT (STRICT OPENROUTER) =====
app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;

    const strictPrompt = `
You are ReelMind AI — a high-performance content generator.

STRICT RULES:
- Follow the user prompt EXACTLY
- Do NOT change topic
- Do NOT add unrelated content
- Be precise and structured
- No filler words

OUTPUT FORMAT (MANDATORY):

Hook:
<short viral hook>

Content:
<main content strictly based on prompt>

Caption:
<engaging caption>

Hashtags:
<relevant hashtags only>

User Prompt:
${prompt}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.2, // 🔥 strict control
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content: "You strictly follow instructions and never go off-topic."
          },
          {
            role: "user",
            content: strictPrompt
          }
        ]
      })
    });

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content || "No AI response";

    res.json({ data: { content } });

  } catch (err) {
    console.error("TEXT ERROR:", err);
    res.status(500).json({ error: "Text AI failed" });
  }
});

// ===== IMAGE (REAL POLLINATIONS) =====
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    res.json({ data: { url } });

  } catch (err) {
    console.error("IMAGE ERROR:", err);
    res.status(500).json({ error: "Image AI failed" });
  }
});

// ===== VIDEO (READY FOR RUNWAY) =====
app.post("/generate-video", async (req, res) => {
  try {
    const url = "https://www.w3schools.com/html/mov_bbb.mp4";

    res.json({ data: { url } });

  } catch (err) {
    console.error("VIDEO ERROR:", err);
    res.status(500).json({ error: "Video AI failed" });
  }
});

// ===== HEALTH =====
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

// ===== START =====
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
