import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

app.get("/", (req, res) => {
  res.send("Backend is live");
});

/* IMAGE GENERATION */
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: "blurry, low quality, distorted"
          },
          options: { wait_for_model: true }
        }),
      }
    );

    const contentType = response.headers.get("content-type");

    if (!response.ok || !contentType || !contentType.includes("image")) {
      const text = await response.text();
      console.log("HF IMAGE ERROR:", text);
      return res.status(500).send("Image failed");
    }

    const buffer = await response.arrayBuffer();

    res.set("Content-Type", "image/png");
    res.send(Buffer.from(buffer));

  } catch (e) {
    console.log("SERVER IMAGE ERROR:", e);
    res.status(500).send("Error");
  }
});

/* VIDEO GENERATION */
app.post("/video", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/damo-vilab/text-to-video-ms-1.7b",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          options: { wait_for_model: true }
        }),
      }
    );

    const contentType = response.headers.get("content-type");

    if (!response.ok || !contentType || !contentType.includes("video")) {
      const text = await response.text();
      console.log("HF VIDEO ERROR:", text);
      return res.status(500).send("Video failed");
    }

    const buffer = await response.arrayBuffer();

    res.set("Content-Type", "video/mp4");
    res.send(Buffer.from(buffer));

  } catch (e) {
    console.log("SERVER VIDEO ERROR:", e);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running"));
