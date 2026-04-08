import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": "Token YOUR_REPLICATE_API_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45f3f0a2a6d9c7e6a8d1f4d74d1c7c0b2fdf8a2e9d3b1b3e4e2c6d1a1f", // video model
        input: {
          prompt: prompt
        }
      })
    });

    const data = await response.json();

    // 🔥 SEND BACK RESULT
    res.json({
      status: "success",
      output: data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.listen(3000, () => console.log("Server running"));
