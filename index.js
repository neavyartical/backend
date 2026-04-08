import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 ROUTE
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    console.log("User prompt:", prompt);

    const response = await fetch("https://api-inference.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_HF_API_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt
      })
    });

    const result = await response.arrayBuffer();

    res.setHeader("Content-Type", "video/mp4");
    res.send(Buffer.from(result));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Generation failed" });
  }
});

// 🔥 PORT (IMPORTANT FOR RENDER)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));
