import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt:", prompt);

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "a9758cbf9a7c7d6d0db1b5aefb6dc9c6c0e6d9c5d7f8b8e7c9d8f6b7a5e4c3d2",
        input: {
          prompt: prompt
        }
      })
    });

    const data = await response.json();
    console.log("FULL RESPONSE:", data);

    // 🚨 IMPORTANT CHECK
    if (!data.id) {
      return res.status(500).json({
        error: "Replicate failed",
        details: data
      });
    }

    let result;

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${data.id}`,
        {
          headers: {
            "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );

      result = await check.json();
      console.log("⏳ Status:", result.status);

      if (result.status === "succeeded") break;
      if (result.status === "failed") throw new Error("AI failed");
    }

    if (result.output) {
      res.json({
        video: Array.isArray(result.output)
          ? result.output[0]
          : result.output
      });
    } else {
      res.status(500).json({ error: "No output generated" });
    }

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 BACKEND RUNNING");
});
