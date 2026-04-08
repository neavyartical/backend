import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔥 BACKEND RUNNING");

const API_KEY = process.env.REPLICATE_API_TOKEN;

if (!API_KEY) {
  console.log("❌ API KEY MISSING");
} else {
  console.log("🔑 KEY LOADED ✅");
}

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log("📩 Prompt:", prompt);

    // STEP 1: Start prediction
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "db21e45e8f922c3f6c7c5e6cdeaa9f6c1c7e8d2a0c0a6f7b6d3e2b1c0a9f8e7d",
        input: { prompt: prompt }
      }),
    });

    const prediction = await start.json();

    console.log("🚀 Started:", prediction.id);

    let result;

    // STEP 2: Poll result
    while (true) {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            "Authorization": `Token ${API_KEY}`,
          },
        }
      );

      result = await check.json();

      console.log("⏳ Status:", result.status);

      if (result.status === "succeeded") break;
      if (result.status === "failed") {
        return res.json({ error: "Generation failed" });
      }
    }

    console.log("✅ DONE");

    res.json({ video: result.output });

  } catch (err) {
    console.log("❌ ERROR:", err);
    res.json({ error: err.message });
  }
});

app.listen(10000, () => {
  console.log("🚀 Server running on port 10000");
