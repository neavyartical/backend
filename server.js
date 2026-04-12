// ================= IMPORTS =================
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Stripe = require("stripe");

// FETCH FIX (Render safe)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ================= APP =================
const app = express();
app.use(express.json());
app.use(cors());

// ================= ENV =================
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;
const stripe = new Stripe(process.env.STRIPE_SECRET);

// ================= DB =================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// ================= MODELS =================
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

// ================= AUTH =================
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  await new User({ email, password: hashed }).save();

  return res.json({ msg: "Registered" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ msg: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);

  return res.json({ token });
});

// ================= AI TEXT =================
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.json({ result: "Enter something." });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are ReelMind AI created by Artical Neavy. Answer like ChatGPT + Google + Wikipedia."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    return res.json({
      result: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.log(err);
    return res.json({ result: "AI error" });
  }
});

// ================= IMAGE =================
app.post("/image", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return res.json({
      image: `data:image/png;base64,${base64}`,
      watermark: "ReelMind AI • Artical Neavy"
    });

  } catch (err) {
    console.log(err);
    return res.json({ error: "Image failed" });
  }
});

// ================= VIDEO EDIT =================
app.post("/video-edit", async (req, res) => {
  const { prompt } = req.body;

  return res.json({
    edit: `AI video edited based on: ${prompt}`
  });
});

// ================= STRIPE =================
app.post("/pay", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "ReelMind Premium"
          },
          unit_amount: 500
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: "https://reelmindbackend-1.onrender.com/success",
      cancel_url: "https://reelmindbackend-1.onrender.com/cancel"
    });

    return res.json({ url: session.url });

  } catch (err) {
    console.log(err);
    return res.json({ error: "Payment failed" });
  }
});

// ================= SUCCESS / CANCEL =================
app.get("/success", (req, res) => {
  res.send("<h1>✅ Payment Successful 🚀</h1><p>Welcome to Premium</p>");
});

app.get("/cancel", (req, res) => {
  res.send("<h1>❌ Payment Cancelled</h1>");
});

// ================= ADMIN =================
app.get("/admin", async (req, res) => {
  const users = await User.countDocuments();
  const projects = await Project.countDocuments();

  return res.json({
    users,
    projects,
    note: "Check Stripe dashboard for money 💰"
  });
});

// ================= ADSENSE =================
app.get("/ads.txt", (req, res) => {
  res.send("google.com, pub-1714638410489429, DIRECT, f08c47fec0942fa0");
});

// ================= REQUIRED PAGES =================
app.get("/privacy", (req, res) => {
  res.send("<h1>Privacy Policy</h1><p>Your data is safe.</p>");
});

app.get("/about", (req, res) => {
  res.send("<h1>About</h1><p>ReelMind AI by Artical Neavy</p>");
});

app.get("/contact", (req, res) => {
  res.send("<h1>Contact</h1><p>Email: support@reelmind.ai</p>");
});

app.get("/blog", (req, res) => {
  res.send("<h1>Blog</h1><p>AI content coming soon...</p>");
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("🚀 ReelMind AI Backend Running");
});

// ================= PORT =================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
