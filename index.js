const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 DEBUG LOG (VERY IMPORTANT)
console.log("🔥 BACKEND NEW VERSION RUNNING 🔥");

// 🔑 GET API KEY FROM RENDER ENV
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  console.error("❌ API KEY MISSING!");
} else {
  console.log("🔑 ENV KEY LOADED:", REPLICATE_API_TOKEN.substring(0, 10) + "...");
}

// 🚀 MAIN GENERATE ROUTE
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log("📥 Prompt:", prompt);

    // 🚀 STEP 1: START GENERATION
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "83b8bce9f5b6c4a6e7cbb0f91b5c1a7109a2c81394b1e1b324f4ba19e6e8d3c5",
        input: {
          prompt: prompt
        }
      })
    });

    const startData = await startResponse.json();
    console.log("🚀 Start response:", startData);

    if (!startData.id) {
      return res.status(500).json({ error: "Failed to start generation", details: startData });
    }

    let prediction = startData;

    // ⏳ STEP 2: POLL UNTIL DONE
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`
          }
        }
      );

      prediction = await pollResponse.json();
      console.log("⏳ Status:", prediction.status);
    }

    // ✅ SUCCESS
    if (prediction.status === "succeeded") {
      console.log("✅ DONE:", prediction.output);

      return res.json({
        video: prediction.output
      });
    }

    // ❌ FAILED
    console.log("❌ FAILED:", prediction);
    res.status(500).json({ error: "Generation failed", details: prediction });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🧪 TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// 🚀 START SERVER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
