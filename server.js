const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// 🔐 SIMPLE MEMORY DB (upgrade later to MongoDB)
let users = [];

// 🔑 SECRET
const SECRET = "reelmind_secret";

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  let user = users.find(u => u.email === email);

  if (!user) {
    user = { email, password, premium: false, balance: 0 };
    users.push(user);
  }

  if (user.password !== password) {
    return res.json({ error: "Wrong password" });
  }

  const token = jwt.sign({ email }, SECRET);

  res.json({ token });
});

// ================= VERIFY TOKEN =================
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// ================= TEXT (OPENROUTER) =================
app.post("/generate-text", auth, async (req, res) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_OPENROUTER_API_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: req.body.prompt }]
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Text generation failed" });
  }
});

// ================= IMAGE (POLLINATIONS) =================
app.post("/generate-image", auth, async (req, res) => {
  const prompt = req.body.prompt;

  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

  res.json({ image: imageUrl });
});

// ================= VIDEO (RUNWAY PLACEHOLDER) =================
app.post("/generate-video", auth, async (req, res) => {
  res.json({
    video: "Runway integration coming soon"
  });
});

// ================= PAYMENT (FAKE FOR NOW) =================
app.post("/subscribe", auth, (req, res) => {
  const user = users.find(u => u.email === req.user.email);
  user.premium = true;
  res.json({ success: true });
});

// ================= USER DASHBOARD =================
app.get("/dashboard", auth, (req, res) => {
  const user = users.find(u => u.email === req.user.email);

  res.json({
    email: user.email,
    premium: user.premium,
    balance: user.balance
  });
});

app.listen(PORT, () => console.log("Server running on " + PORT));
