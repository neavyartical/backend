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

  if (!user) return res.status(401).json({ error: "Unauthorized" });

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
// 🔥 REAL AI WITH MODES
// =====================================================

app.post("/generate-text", async (req, res) => {
  try {
    const { prompt, mode } = req.body;

    let systemPrompt = "";

    // ===== MODES =====
    if (mode === "story") {
      systemPrompt = `
Write a cinematic emotional story.
Stay strictly on topic.
Make it vivid and engaging.
`;
    }

    else if (mode === "script") {
      systemPrompt = `
Write a professional video script.

Include:
- Scene breakdown
- Dialogue
- Timing
`;
    }

    else if (mode === "caption") {
      systemPrompt = `
Generate SHORT viral captions only.
Make them punchy and catchy.
`;
    }

    else if (mode === "ads") {
      systemPrompt = `
Write high-converting ad copy.

Include:
- Hook
- Value
- Call to action
`;
    }

    else {
      // 🔥 DEFAULT REELS MODE
      systemPrompt = `
Create viral TikTok content.

FORMAT:
Hook:
Content:
Caption:
Hashtags:

Stay strictly on the prompt.
`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response";

    res.json({ data: { content } });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ===== IMAGE =====
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    res.json({ data: { url } });

  } catch (err) {
    res.status(500).json({ error: "Image AI failed" });
  }
});

// ===== VIDEO (READY FOR RUNWAY) =====
app.post("/generate-video", async (req, res) => {
  try {
    const url = "https://www.w3schools.com/html/mov_bbb.mp4";

    res.json({ data: { url } });

  } catch (err) {
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
