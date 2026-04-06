const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// 🔐 PUT YOUR NEW API KEY HERE
const API_KEY = "hf_YOUR_NEW_KEY";

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
        body: JSON.stringify(req.body),
      }
    );

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: "Error generating image" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port 3000");
});
