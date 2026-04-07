import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.HF_API_KEY;

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/generate", async (req, res) => {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: req.body.inputs
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(text);
      return res.status(500).send(text);
    }

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating image");
  }
});

app.listen(3000, () => console.log("Server running"));
