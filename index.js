import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "YOUR_REPLICATE_API_KEY"; // 🔑 PUT YOUR KEY

app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    // Create prediction
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "stability-ai/stable-diffusion", // ✅ reliable model
        input: { prompt }
      })
    });

    let prediction = await start.json();

    let tries = 0;
    const maxTries = 20; // ⏳ ~1 minute max

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      tries < maxTries
    ) {
      await new Promise(r => setTimeout(r, 3000));
      tries++;

      const poll = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            "Authorization": `Token ${API_KEY}`
          }
        }
      );

      prediction = await poll.json();
    }

    if (prediction.status === "succeeded") {
      res.json({
        success: true,
        output: prediction.output
      });
    } else {
      res.json({
        success: false,
        message: "Took too long or failed"
      });
    }

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.listen(3000, () => console.log("Server running"));
