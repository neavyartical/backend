const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const Stripe = require("stripe");

const app = express();
app.use(express.json());
app.use(cors());

const stripe = new Stripe(process.env.STRIPE_SECRET);

// ENV
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

// DB
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.log(err));

// MODELS
const User = mongoose.model("User", {
  email: String,
  password: String,
  plan: { type: String, default: "free" }
});

const Project = mongoose.model("Project", {
  userId: String,
  content: String,
  type: String,
  createdAt: { type: Date, default: Date.now }
});

// AUTH
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).send("Invalid token");
  }
}

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await new User({ email, password: hashed }).save();
  res.json({ msg: "Registered" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.json({ msg: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// AI TEXT
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.json({ result: "Enter something." });

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await r.json();

    res.json({
      result: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch {
    res.json({ result: "AI error" });
  }
});

// IMAGE
app.post("/image", async (req, res) => {
  const { prompt } = req.body;

  try {
    const r = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    const buffer = await r.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    res.json({ image: `data:image/png;base64,${base64}` });

  } catch {
    res.json({ error: "Image failed" });
  }
});

// VIDEO (placeholder but working)
app.post("/video-edit", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    edit: "Video edited: " + prompt
  });
});

// SAVE
app.post("/save", auth, async (req, res) => {
  const { content, type } = req.body;

  await new Project({
    userId: req.userId,
    content,
    type
  }).save();

  res.json({ msg: "Saved" });
});

// ADMIN
app.get("/admin", async (req, res) => {
  const users = await User.find();
  const projects = await Project.find();
  res.json({ users, projects });
});

// STRIPE
app.post("/pay", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "ReelMind Pro" },
        unit_amount: 500
      },
      quantity: 1
    }],
    mode: "payment",
    success_url: "https://example.com",
    cancel_url: "https://example.com"
  });

  res.json({ url: session.url });
});

// ADSENSE
app.get("/ads.txt", (req, res) => {
  res.send("google.com, pub-xxxxxxxxxxxx, DIRECT, f08c47fec0942fa0");
});

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.listen(10000, () => console.log("🔥 Server running"));
