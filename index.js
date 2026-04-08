import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 10000;

// 🔑 YOUR REPLICATE API KEY FROM RENDER ENV
const API_KEY = process.env.REPLICATE_API_TOKEN;

console.log("🔥 BACKEND RUNNING");
console.log("🔑 KEY:", API_KEY ? "LOADED ✅" : "MISSING ❌");

app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log("🎯 Prompt:", prompt);

    // STEP 1: Start prediction
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "db21e45c2c7d43c6d5f3f5bde9d1e3c3b6e6b77c5e6c9fcbf3b0d7c5c6a3b7f5", // video model
        input: {
          prompt: prompt,
        },
      }),
    });

    const startData = await start.json();
    console.log("🚀 Start:", startData);

    let status = startData.status;
    let id = startData.id;

    // STEP 2: Poll result
    while (status !== "succeeded" && status !== "failed") {
      await new Promise(r => setTimeout(r, 3000));

      const check = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: {
          "Authorization": `Token ${API_KEY}`,
        },
      });

      const checkData = await check.json();
      status = checkData.status;

      console.log("⏳ Status:", status);

      if (status === "succeeded") {
        return res.json({ video: checkData.output[0] });
      }

      if (status === "failed") {
        return res.json({ error: "Generation failed" });
      }
    }

  } catch (err) {
    console.error(err);
    res.json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
