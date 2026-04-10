import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();

/* ================= STRIPE ================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= IMPORTANT MIDDLEWARE ================= */
// ⚠️ ORDER MATTERS FOR STRIPE WEBHOOK
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(cors());
app.use(express.json());

console.log("🔥 FULL SaaS Backend Running 🔥");

/* ================= JWT ================= */
const JWT_SECRET = "neavyartical_allahmystrenght_ultra_secure_1995";

/* ================= DEBUG ================= */
console.log("MONGO:", process.env.MONGO_URL ? "OK ✅" : "MISSING ❌");
console.log("OPENROUTER:", process.env.OPENROUTER_API_KEY ? "OK ✅" : "MISSING ❌");
console.log("STRIPE:", process.env.STRIPE_SECRET_KEY ? "OK ✅" : "MISSING ❌");

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* ================= MONGO ================= */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("Mongo error ❌:", err));

/* ================= MODEL ================= */
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  credits: { type: Number, default: 10 },
  lastReset: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.json({ error: "User exists ❌" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashed });
    await user.save();

    res.json({ message: "Registered ✅" });

  } catch {
    res.json({ error: "Register error ❌" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ error: "User not found ❌" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ error: "Wrong password ❌" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({
      token,
      credits: user.credits
    });

  } catch {
    res.json({ error: "Login error ❌" });
  }
});

/* ================= GENERATE ================= */
app.post("/generate", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.json({ error: "No token ❌" });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.json({ error: "Invalid token ❌" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.json({ error: "User not found ❌" });

    // 🔁 DAILY RESET
    const now = new Date();
    const diff = (now - new Date(user.lastReset)) / (1000 * 60 * 60);

    if (diff >= 24) {
      user.credits = 10;
      user.lastReset = now;
      await user.save();
      console.log("🔄 Credits reset");
    }

    // 🚨 CHECK CREDITS
    if (user.credits <= 0) {
      return res.json({ error: "No credits left ❌" });
    }

    const { prompt } = req.body;
    if (!prompt) return res.json({ error: "No prompt ❌" });

    // 🔥 OPENROUTER AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://reelmind.app",
        "X-Title": "ReelMind AI"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: "Create viral cinematic reel scripts with hook, scenes and storytelling."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices) {
      console.log(data);
      return res.json({ error: "AI failed ❌" });
    }

    // ➖ DEDUCT CREDIT
    user.credits -= 1;
    await user.save();

    res.json({
      result: data.choices[0].message.content,
      credits: user.credits
    });

  } catch (err) {
    console.log(err);
    res.json({ error: "Generation failed ❌" });
  }
});

/* ================= STRIPE CHECKOUT ================= */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, JWT_SECRET);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        userId: decoded.id
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "100 AI Credits"
            },
            unit_amount: 500
          },
          quantity: 1
        }
      ],
      success_url: "https://your-frontend.com/success",
      cancel_url: "https://your-frontend.com/cancel"
    });

    res.json({ url: session.url });

  } catch (err) {
    console.log(err);
    res.json({ error: "Payment error ❌" });
  }
});

/* ================= STRIPE WEBHOOK ================= */
app.post("/stripe-webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook error:", err.message);
    return res.status(400).send("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;

    try {
      const user = await User.findById(userId);
      if (user) {
        user.credits += 100;
        await user.save();
        console.log("💰 Credits added via Stripe");
      }
    } catch (err) {
      console.log("DB error:", err);
    }
  }

  res.json({ received: true });
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running 🚀");
});
