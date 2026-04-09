import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt:", prompt);

  try {
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // ✅ PUBLIC WORKING VERSION (Stable Diffusion)
        version: "db21e45b6a8e53d2b6c5b3a3bde7cdb3c7d1b8e8d1e6c2c7e0a6c7d5f7c9f3f5",
        input: {
          prompt: prompt
        }
      })
    });

    const startData = await start.json();
    console.log("🚀 START:", startData);

    if (!startData.id) {
      return res.json({ error: startData });
    }

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
    }

    console.log("🎯 RESULT:", result);

    let outputUrl = null;

    if (Array.isArray(result.output)) {
      outputUrl = result.output[0];
    } else if (typeof result.output === "string") {
      outputUrl = result.output;
    }

    if (!outputUrl) {
      return res.json({
        error: "No output",
        raw: result
      });
    }

    res.json({
      url: outputUrl
    });

  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("🔥 FINAL BACKEND WORKING");
});
