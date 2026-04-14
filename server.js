// ===== IMPORTS =====
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE (IN-MEMORY FOR NOW) =====
let users = {};
let posts = [];
let idCounter = 1;

// ===== SOCKET =====
io.on("connection", (socket) => {
  console.log("User connected");
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

  // 🔥 REALTIME PUSH
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
  if (post) {
    post.likes++;
  }

  res.json({ success: true });
});

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
