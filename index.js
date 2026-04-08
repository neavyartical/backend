import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    console.log("Prompt:", prompt);

    // STEP 1: Start prediction
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": "Token YOUR_REPLICATE_API_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "a9758cbf...REPLACE_THIS...", // ⚠️ will fix below
        input: {
          prompt: prompt
        }
      })
    });

    const startData = await start.json();

    if (startData.error) {
      console.log(startData);
      return res.status(500).json({ error: "Start failed" });
    }

    let result = startData;

    // STEP 2: Wait until finished
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${result.id}`,
        {
          headers: {
            "Authorization": "Token YOUR_REPLICATE_API_KEY"
          }
        }
      );

      result = await check.json();
      console.log("Status:", result.status);
    }

    if (result.status === "succeeded") {
      console.log(result.output);

      res.json({
        video: result.output[0] // 👈 important
      });

    } else {
      res.status(500).json({ error: "Generation failed" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));
