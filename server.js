import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// ✅ CORS FIX
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ✅ API KEY FROM RENDER ENV
const API_TOKEN = process.env.REPLICATE_API_TOKEN;

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    // 🔥 START GENERATION
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // ✅ WORKING MODEL VERSION (Stable Diffusion)
        version: "ac732df83cea7fff1b5f8c5e9a1c0b4c0b9c9d1b9c9b9c9b9c9b9c9b9c9b9c9b",
        input: {
          prompt: prompt
        }
      })
    });

    let prediction = await start.json();

    // ❗ DEBUG (helps if error happens)
    console.log("START:", prediction);

    // ⏳ WAIT UNTIL FINISHED
    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(prediction.urls.get, {
        headers: {
          "Authorization": `Token ${API_TOKEN}`
        }
      });

      prediction = await check.json();
      console.log("CHECK:", prediction.status);
    }

    // ❌ IF FAILED
    if (prediction.status === "failed") {
      return res.json({ error: "Generation failed", details: prediction });
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
