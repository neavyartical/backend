import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import Stripe from "stripe";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔐 ENV
const JWT_SECRET = "reelmind_secret";
const OPENROUTER_KEY = "YOUR_OPENROUTER_KEY";
const stripe = new Stripe("YOUR_STRIPE_SECRET");

// ================= DATABASE =================
mongoose.connect("YOUR_MONGODB_URI");

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  premium: Boolean,
  balance: Number
});

const User = mongoose.model("User", UserSchema);

// ================= AUTH =================
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No token");

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const user = new User({
    email,
    password,
    premium: false,
    balance: 0
  });

  await user.save();

  res.json({ success: true });
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);

  if (!user) return res.json({ error: "Invalid login" });

  const token = jwt.sign({ email: user.email }, JWT_SECRET);
  res.json({ token });
});

// ================= TEXT (AI) =================
app.post("/generate-text", auth, async (req, res) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
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
app.post("/generate-image", auth, (req, res) => {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;
  res.json({ image: url });
});

// ================= VIDEO =================
app.post("/generate-video", auth, async (req, res) => {
  res.json({ message: "Runway API connect here" });
});

// ================= PAYMENT =================
app.post("/create-checkout", auth, async (req, res) => {
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
    success_url: "https://your-site.com/success",
    cancel_url: "https://your-site.com/cancel"
  });

  res.json({ url: session.url });
});

// ================= DASHBOARD =================
app.get("/dashboard", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user);
});

app.listen(PORT, () => console.log("Server running"));
