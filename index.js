import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// 🔑 YOUR REPLICATE API KEY
const API_KEY = process.env.REPLICATE_API_KEY;

if (!API_KEY) {
  console.log("❌ API KEY MISSING!");
} else {
  console.log("🔑 ENV KEY LOADED:", API_KEY.slice(0, 8) + "...");
}

// 🚀 GENERATE VIDEO
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    console.log("🚀 Prompt:", prompt);

    // STEP 1: CREATE PREDICTION
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "db21e45d3f3aebfdbe0e6e8f4a4cbb6a9d9b8e3d3e4f9e1a7d4b2f8c9c1a0abc", // video model
        input: {
          prompt: prompt,
          fps: 24
        },
      }),
    });

    const data = await response.json();
    console.log("📦 Start response:", data);

    if (!data.id) {
      return res.status(500).json({ error: data });
    }

    let status = data.status;
    let output = null;

    // STEP 2: WAIT FOR RESULT
    while (status !== "succeeded" && status !== "failed") {
      await new Promise((r) => setTimeout(r, 3000));

      const poll = await fetch(
        `https://api.replicate.com/v1/predictions/${data.id}`,
        {
          headers: {
            Authorization: `Token ${API_KEY}`,
          },
        }
      );

      const pollData = await poll.json();

      console.log("⏳ Status:", pollData.status);

      status = pollData.status;
      output = pollData.output;
    }

    if (status === "succeeded") {
      console.log("✅ DONE:", output);
      res.json({ video: output[0] });
    } else {
      res.status(500).json({ error: "Generation failed" });
    }
  } catch (err) {
    console.log("❌ ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ROOT TEST
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
