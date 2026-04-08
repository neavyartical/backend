import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const REPLICATE_API_TOKEN = "YOUR_REPLICATE_API_KEY"; // 🔑 PUT YOUR KEY HERE

app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    // STEP 1: Start prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45c3b0f5b5f2d7d2a0f5f4d1c5d", // stable video/image model
        input: { prompt }
      })
    });

    let prediction = await response.json();

    // STEP 2: Poll until done
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const poll = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`
          }
        }
      );

      prediction = await poll.json();
    }

    // STEP 3: Return result
    if (prediction.status === "succeeded") {
      res.json({
        success: true,
        video: prediction.output
      });
    } else {
      res.json({ success: false });
    }

  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
