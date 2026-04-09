const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// IMPORTANT: Render port
const PORT = process.env.PORT || 3000;

// USERS
let users = {};

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!users[username]) {
    users[username] = { password, premium: false };
  }

  if (users[username].password === password) {
    res.json({ success: true, premium: users[username].premium });
  } else {
    res.json({ success: false });
  }
});

// VERIFY PAYMENT
app.post("/verify-payment", (req, res) => {
  const { username } = req.body;

  if (users[username]) {
    users[username].premium = true;
    return res.json({ success: true });
  }

  res.json({ success: false });
});

// GENERATE
app.post("/generate", async (req, res) => {
  const { prompt, type } = req.body;

  // IMAGE (FREE)
  if (type === "image") {
    return res.json({
      result: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    });
  }

  // FALLBACK AI (ALWAYS WORKS)
  res.json({
    result: "🤖 " + prompt + " is a powerful idea!"
  });
});

// ROOT TEST (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

// START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
