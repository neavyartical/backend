import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// ✅ FIXED CORS (VERY IMPORTANT)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const API_TOKEN = process.env.REPLICATE_API_TOKEN;

// ✅ TEST ROUTE (so you know server is alive)
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45c1f4e3b7d7d9d8f1b0c5c3f7d9e6a7e2d9f1c8b7a6d5e4c3b2a1f0e9",
        input: { prompt }
      })
    });

    let prediction = await start.json();

    // ⏳ WAIT UNTIL DONE
    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(prediction.urls.get, {
        headers: {
          "Authorization": `Token ${API_TOKEN}`
        }
      });

      prediction = await check.json();
    }

    res.json(prediction);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running 🚀"));
