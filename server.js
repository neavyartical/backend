const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");

const app = express();
app.use(cors());
app.use(express.json());

// ================= ENV =================
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "reelmind_secret";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET;
const MONGO_URI = process.env.MONGO_URI;

const stripe = new Stripe(STRIPE_SECRET);

// ================= DB =================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err.message));

// ================= MODELS =================
const User = mongoose.model("User", {
  email: String,
  credits: { type: Number, default: 20 },
  premium: { type: Boolean, default: false },
  earnings: { type: Number, default: 0 },
  created: { type: Date, default: Date.now }
});

// ================= AUTH =================
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend LIVE");
});

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });
  if (user) return res.json({ message: "User exists" });

  user = await User.create({ email });

  res.json({ success: true, user });
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email });
  }

  const token = jwt.sign({ email: user.email }, JWT_SECRET);

  res.json({ token, user });
});

// ================= DASHBOARD =================
app.get("/dashboard", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user);
});

// ================= AI TEXT =================
app.post("/generate-text", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  if (!user.premium && user.credits <= 0) {
    return res.json({ error: "No credits left" });
  }

  if (!user.premium) {
    user.credits--;
    await user.save();
  }

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

  } catch {
    res.status(500).json({ error: "AI failed" });
  }
});

// ================= IMAGE =================
app.post("/generate-image", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  if (!user.premium && user.credits <= 0) {
    return res.json({ error: "No credits left" });
  }

  if (!user.premium) {
    user.credits--;
    await user.save();
  }

  const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;

  res.json({ image });
});

// ================= REELS =================
app.post("/viral-reel", auth, async (req, res) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: "Create viral TikTok reel: " + req.body.prompt
        }]
      })
    });

    const data = await response.json();
    res.json(data);

  } catch {
    res.status(500).json({ error: "Reel failed" });
  }
});

// ================= STRIPE =================
app.post("/pay", auth, async (req, res) => {
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
});

// ================= PAYPAL =================
app.get("/paypal", (req, res) => {
  res.json({ url: "https://www.paypal.me/YOURNAME/10" });
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
