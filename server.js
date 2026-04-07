import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = "PASTE_YOUR_NEW_TOKEN_HERE";

app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).send(error);
    }

    const image = await response.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(image));

  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.listen(3000, () => console.log("Backend running on port 3000"));
