const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const Stripe = require("stripe");
const Replicate = require("replicate");

const app = express();
app.use(cors());
app.use(express.json());

/* ENV KEYS */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const HF_API_KEY = process.env.HF_API_KEY;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

/* HEALTH CHECK */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* 💰 STRIPE PAYMENT */
app.post("/create-checkout-session", async (req, res) => {
  try {
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

  } catch (err) {
    console.error(err);
    res.status(500).send("Stripe error");
  }
});

/* 🖼️ IMAGE GENERATION (HF) */
app.post("/generate", async (req, res) => {
  try {
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

  } catch (err) {
    console.error(err);
    res.status(500).send("HF error");
  }
});

/* 🎬 REAL VIDEO GENERATION (REPLICATE) */
app.post("/video", async (req, res) => {
  try {
    const { prompt } = req.body;

    const output = await replicate.run(
      "lucataco/animate-diff:latest",
      {
        input: {
          prompt: prompt,
          num_frames: 16,
          guidance_scale: 7.5
        }
      }
    );

    console.log("VIDEO OUTPUT:", output);

    if (!output || !output[0]) {
      return res.status(500).json({ error: "No video generated" });
    }

    res.json({ video: output[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Video generation failed" });
  }
});

/* 🚀 START SERVER */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
