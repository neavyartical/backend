import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// ✅ CORS (fix connection issues)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ✅ YOUR API KEY (from Render)
const API_TOKEN = process.env.REPLICATE_API_TOKEN;

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// ✅ GENERATE ROUTE
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    // 🔥 CREATE PREDICTION (NEW WORKING METHOD)
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "stability-ai/sdxl", // ✅ FIXED MODEL
        input: {
          prompt: prompt
        }
      })
    });

    let prediction = await start.json();
    console.log("START:", prediction);

    // ⏳ WAIT UNTIL DONE
    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(prediction.urls.get, {
        headers: {
          "Authorization": `Token ${API_TOKEN}`
        }
      });

      prediction = await check.json();
      console.log("STATUS:", prediction.status);
    }

    // ❌ IF FAILED → SEND ERROR BACK
    if (prediction.status === "failed") {
      return res.json({
        error: "Generation failed",
        details: prediction
      });
    }

    // ✅ SUCCESS
    res.json(prediction);

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 START SERVER
app.listen(3000, () => console.log("Server running 🚀"));
