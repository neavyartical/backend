import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// Generate route
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt:", prompt);

  try {
    // 🔥 Start prediction
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "ac732df83cea7fff5b7b6d4f8f5e4f7a0f5f2c4f6c7a2f5c4b3e6d5c7a8b9c1d",
        input: {
          prompt: prompt
        }
      })
    });

    const startData = await start.json();
    console.log("🚀 START DATA:", startData);

    // ❌ If model fails
    if (!startData.id) {
      return res.status(500).json({
        error: "Failed to start generation",
        details: startData
      });
    }

    let result;

    // ⏳ Polling loop
    for (let i = 0; i < 15; i++) {
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
      console.log("⏳ STATUS:", result.status);

      if (result.status === "succeeded") break;
      if (result.status === "failed") {
        throw new Error("AI generation failed");
      }
    }

    console.log("🎯 FINAL RESULT:", result);

    // ✅ Return output (image or video)
    if (result.output) {
      res.json({
        video: Array.isArray(result.output)
          ? result.output[0]
          : result.output
      });
    } else {
      res.status(500).json({
        error: "No output returned",
        result: result
      });
    }

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({
      error: "Generation failed"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log("🔥 BACKEND RUNNING SUCCESSFULLY");
});
