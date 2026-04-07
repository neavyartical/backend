const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const Stripe = require("stripe");

let Replicate;
let replicate;

try {
  Replicate = require("replicate");
  if (process.env.REPLICATE_API_TOKEN) {
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });
  }
} catch (e) {
  console.log("Replicate not installed");
}

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/* HEALTH */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* PAYMENT */
app.post("/create-checkout-session", async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({ url: "#" });
    }

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

/* IMAGE (HF) */
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.HF_API_KEY) {
      return res.status(500).send("No HF API key");
    }

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
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

/* 🎬 REAL VIDEO (WORKING MODEL) */
app.post("/video", async (req, res) => {
  try {
    const { prompt } = req.body;

    // fallback if token not added
    if (!replicate) {
      return res.json({
        video: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif"
      });
    }

    const output = await replicate.run(
      "cjwbw/zeroscope-v2-xl",
      {
        input: {
          prompt: prompt,
          num_frames: 24,
          fps: 8
        }
      }
    );

    console.log("VIDEO OUTPUT:", output);

    if (!output) {
      return res.json({
        video: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif"
      });
    }

    res.json({ video: output });

  } catch (err) {
    console.error(err);

    res.json({
      video: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif"
    });
  }
});

/* START */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
