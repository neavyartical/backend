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
    // START GENERATION
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45b6a8e53d2b6c5b3a3bde7cdb3c7d1b8e8d1e6c2c7e0a6c7d5f7c9f3f5",
        input: { prompt }
      })
    });

    const startData = await start.json();
    console.log("🚀 Started:", startData.id);

    // ⏱️ WAIT LOOP (WITH LIMIT — IMPORTANT)
    let result;
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
      if (result.status === "failed") throw new Error("AI failed");
    }

    // ✅ RETURN RESULT
    if (result.output && result.output.length > 0) {
      res.json({
        video: result.output[0]
      });
    } else {
      res.status(500).json({ error: "No output" });
    }

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 REPLICATE BACKEND RUNNING");
});
