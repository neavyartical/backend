const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors()); // 🔥 VERY IMPORTANT
app.use(express.json());

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.REPLICATE_API_TOKEN;

// Debug
console.log("🔥 BACKEND RUNNING");
if (!API_KEY) {
  console.log("❌ API KEY MISSING!");
} else {
  console.log("🔑 KEY: LOADED ✅");
}

// Test route
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// Generate route
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  console.log("🎯 Prompt:", prompt);

  try {
    // 🔥 STEP 1: Start generation (IMAGE MODEL for now)
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "stability-ai/sdxl", // ✅ working model
        input: {
          prompt: prompt,
        },
      }),
    });

    const startData = await start.json();
    console.log("🚀 Start:", startData);

    let status = startData.status;
    let id = startData.id;

    // 🔥 STEP 2: Poll result
    while (status !== "succeeded" && status !== "failed") {
      await new Promise((r) => setTimeout(r, 2000));

      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${id}`,
        {
          headers: {
            Authorization: `Token ${API_KEY}`,
          },
        }
      );

      const checkData = await check.json();
      status = checkData.status;

      console.log("⏳ Status:", status);

      if (status === "succeeded") {
        console.log("✅ Output:", checkData.output);

        return res.json({
          video: checkData.output, // 🔥 returning image URL
        });
      }

      if (status === "failed") {
        return res.json({ error: "Generation failed" });
      }
    }
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
