import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// GENERATE VIDEO ROUTE
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    // ⚠️ Replace with your Replicate API Key
    const REPLICATE_API = "YOUR_API_KEY_HERE";

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "783f2c7c4f9c7c9f3c4d4d1e6c1c6d0e", 
        input: {
          prompt: prompt
        }
      })
    });

    const data = await response.json();

    res.json({
      status: "processing",
      data: data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
