const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

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
  console.log("Replicate not ready");
}

const app = express();
app.use(cors());
app.use(express.json());

/* TEST */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* 🖼 IMAGE FIXED */
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.HF_API_KEY) {
      return res.status(500).send("Missing HF key");
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
          inputs: prompt
        })
      }
    );

    // 🔥 IMPORTANT CHECK
    if (!response.ok) {
      const text = await response.text();
      console.log("HF ERROR:", text);
      return res.status(500).send("HF failed");
    }

    const arrayBuffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(arrayBuffer));

  } catch (err) {
    console.error(err);
    res.status(500).send("Image error");
  }
});

/* 🎬 VIDEO FIXED */
app.post("/video", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!replicate) {
      return res.json({
        video: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"
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

    console.log("VIDEO:", output);

    if (!output || typeof output !== "string") {
      return res.json({
        video: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"
      });
    }

    res.json({ video: output });

  } catch (err) {
    console.error(err);
    res.json({
      video: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"
    });
  }
});

/* START */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
