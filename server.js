import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.HF_API_KEY;

app.post("/generate", async (req, res) => {
  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: req.body.prompt,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: text });
    }

    const imageBuffer = await response.arrayBuffer();

    res.set("Content-Type", "image/png");
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    res.status(500).json({ error: "Failed to generate image" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
