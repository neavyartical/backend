import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = "PUT_YOUR_REPLICATE_API_KEY_HERE";

// 🎬 GENERATE VIDEO
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    // STEP 1: CREATE PREDICTION
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45f3f0a2a6d9c7e6a8d1f4d74d1c7c0b2fdf8a2e9d3b1b3e4e2c6d1a1f",
        input: {
          prompt: prompt
        }
      })
    });

    const prediction = await start.json();
    const id = prediction.id;

    // STEP 2: WAIT UNTIL DONE
    let result;

    while (true) {
      const check = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: {
          "Authorization": `Token ${API_KEY}`
        }
      });

      result = await check.json();

      if (result.status === "succeeded") break;
      if (result.status === "failed") {
        return res.json({ error: "Generation failed" });
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    // STEP 3: RETURN VIDEO URL
    res.json({
      video: result.output[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.listen(3000, () => console.log("Server running on port 3000"));
