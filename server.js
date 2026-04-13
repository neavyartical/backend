const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const SECRET = "reelmind_secret";

// 🔑 ADD YOUR KEYS HERE
const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";
const stripe = new Stripe("YOUR_STRIPE_SECRET");

// ================= DATABASE (TEMP MEMORY) =================
let users = [];

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Running");
});

// ================= AUTH =================
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ================= REGISTER =================
app.post("/register", (req, res) => {
  const { email } = req.body;

  let existing = users.find(u => u.email === email);
  if (existing) return res.json({ message: "User exists" });

  const user = {
    email,
    credits: 20,
    premium: false,
    earnings: 0,
    created: new Date()
  };

  users.push(user);
  res.json({ success: true, user });
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { email } = req.body;

  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      email,
      credits: 20,
      premium: false,
      earnings: 0,
      created: new Date()
    };
    users.push(user);
  }

  const token = jwt.sign({ email }, SECRET);
  res.json({ token, user });
});

// ================= USER DASHBOARD =================
app.get("/dashboard", auth, (req, res) => {
  const user = users.find(u => u.email === req.user.email);
  res.json(user);
});

// ================= AI TEXT =================
app.post("/generate-text", auth, async (req, res) => {
  const user = users.find(u => u.email === req.user.email);

  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.premium && user.credits <= 0) {
    return res.json({ error: "No credits left" });
  }

  if (!user.premium) user.credits--;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
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
    res.status(500).json({ error: "AI failed" });
  }
});

// ================= IMAGE =================
app.post("/generate-image", auth, (req, res) => {
  const user = users.find(u => u.email === req.user.email);

  if (!user.premium && user.credits <= 0) {
    return res.json({ error: "No credits left" });
  }

  if (!user.premium) user.credits--;

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;
  res.json({ image: url });
});

// ================= VIRAL REELS =================
app.post("/viral-reel", auth, (req, res) => {
  const prompt = req.body.prompt;

  const reel = {
    script: `🔥 Viral Reel Idea: ${prompt}`,
    scenes: [
      "Hook (first 3 seconds)",
      "Build tension",
      "Climax",
      "Call to action"
    ],
    captions: [
      "Wait for it 😳",
      "This went viral 🔥",
      "You won’t believe this"
    ],
    hashtags: ["#viral", "#fyp", "#trending", "#ai"]
  };

  res.json(reel);
});

// ================= STRIPE PAYMENT =================
app.post("/pay", auth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "ReelMind Premium" },
          unit_amount: 999
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: "https://your-site.com",
      cancel_url: "https://your-site.com"
    });

    res.json({ url: session.url });

  } catch {
    res.status(500).json({ error: "Payment failed" });
  }
});

// ================= PAYPAL =================
app.get("/paypal", (req, res) => {
  res.json({
    url: "https://www.paypal.com/paypalme/YOURNAME/10"
  });
});

// ================= ADMIN DASHBOARD =================
app.get("/admin", (req, res) => {
  res.json({
    totalUsers: users.length,
    users,
    totalRevenue: users.reduce((sum, u) => sum + u.earnings, 0)
  });
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
