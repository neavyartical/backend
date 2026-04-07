import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import Stripe from "stripe";

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const HF_API_KEY = process.env.HF_API_KEY;

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* STRIPE PAYMENT */
app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "ReelMind PRO" },
        unit_amount: 500
      },
      quantity: 1
    }],
    success_url: "https://neavyartical.github.io/ReelMind-Ai/?success=true",
    cancel_url: "https://neavyartical.github.io/ReelMind-Ai/"
  });

  res.json({ url: session.url });
});

/* IMAGE */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        options: { wait_for_model: true }
      })
    }
  );

  const buffer = await response.arrayBuffer();
  res.set("Content-Type", "image/png");
  res.send(Buffer.from(buffer));
});

app.listen(10000, () => console.log("Server running"));
