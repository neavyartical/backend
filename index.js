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
    // 🔥 START REQUEST TO REPLICATE
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "83b7b2a1d0ef3b6f3a5fcd9d36c3a7c2bdfcb4a9c3bbfd7c7f0e2b1e6e9c6d6c",
        input: {
          prompt: prompt,
          fps: 8,
          width: 512,
          height: 512,
          num_frames: 16
        }
      })
    });

    const startData = await start.json();
    console.log("🚀 Start Data:", startData);

    if (!startData.id) {
      return res.status(500).json({
        error: "Failed to start generation",
        details: startData
      });
    }

    let result;

    // ⏳ WAIT LOOP
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${startData.id}`,
        {
          headers: {
            "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );

      result = await check.json();
      console.log("⏳ Status:", result.status);

      if (result.status === "succeeded") break;
      if (result.status === "failed") {
        throw new Error("AI generation failed");
      }
    }

    console.log("🎯 FINAL RESULT:", result);

    if (result.output) {
      res.json({
        video: Array.isArray(result.output)
          ? result.output[0]
          : result.output
      });
    } else {
      res.status(500).json({
        error: "No video returned",
        result: result
      });
    }

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 REPLICATE VIDEO BACKEND RUNNING");
});
