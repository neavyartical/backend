import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          options: {
            wait_for_model: true
          }
        }),
      }
    );

    // 🔥 Handle errors properly
    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF ERROR:", errorText);
      return res.status(500).send("Error from Hugging Face");
    }

    const buffer = await response.arrayBuffer();

    res.set("Content-Type", "image/png");
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).send("Backend error");
  }
});

app.listen(3000, () => console.log("Backend running on port 3000"));
