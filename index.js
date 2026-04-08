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

// GENERATE IMAGE
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
        version: "a9758cbf8b2d6d8e0c2c9e5cde5a4c8e3b0c44298fc1c149afbf4c8996fb9241",
        input: { prompt }
      })
    });

    const data = await start.json();
    console.log("🚀 Started:", data);

    let result;

    while (true) {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      result = await check.json();
      console.log("⏳ Status:", result.status);

      if (result.status === "succeeded") break;
      if (result.status === "failed") throw new Error("AI failed");
    }

    if (result.output && result.output.length > 0) {
      console.log("✅ Output:", result.output[0]);

      res.json({
        video: result.output[0] // image URL
      });
    } else {
      res.status(500).json({ error: "No output from AI" });
    }

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 BACKEND RUNNING");
});
