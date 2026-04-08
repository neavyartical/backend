const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// MAIN GENERATE ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log("📩 Prompt:", prompt);
    console.log("🔑 ENV KEY:", process.env.REPLICATE_API_TOKEN);

    // ❌ STOP if key missing
    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({
        error: "API key missing in Render ENV"
      });
    }

    // STEP 1: START PREDICTION
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "3f0457b3b3c1d4f8c1cbb9c3a7d8b3b6b3b9b7e9e5f9b7b3c3d9e3b3c3b3b3b3",
        input: {
          prompt: prompt
        }
      })
    });

    const startData = await start.json();
    console.log("🚀 Start response:", startData);

    if (!startData.urls || !startData.urls.get) {
      return res.status(500).json({
        error: "Failed to start generation",
        details: startData
      });
    }

    // STEP 2: POLL RESULT
    let result;

    while (true) {
      await new Promise(r => setTimeout(r, 2000));

      const poll = await fetch(startData.urls.get, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      result = await poll.json();
      console.log("⏳ Status:", result.status);

      if (result.status === "succeeded") break;

      if (result.status === "failed") {
        return res.status(500).json({
          error: "Generation failed",
          details: result
        });
      }
    }

    console.log("✅ Output:", result.output);

    res.json({
      video: result.output[0]
    });

  } catch (err) {
    console.error("🔥 ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));
