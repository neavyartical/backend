import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }

    const buffer = await response.arrayBuffer();

    res.set("Content-Type", "image/png");
    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running"));
