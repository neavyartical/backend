const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "3f0457b3b3c1d4f8c1cbb9c3a7d8b3b6b3b9b7e9e5f9b7b3c3d9e3b3c3b3b3b3",
        input: {
          prompt: prompt
        }
      })
    });

    const data = await response.json();

    if (!data.urls || !data.urls.get) {
      return res.status(500).json({ error: "Failed to start generation" });
    }

    let result;

    while (true) {
      const poll = await fetch(data.urls.get, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      result = await poll.json();

      if (result.status === "succeeded") break;
      if (result.status === "failed") {
        return res.status(500).json({ error: "Generation failed" });
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    res.json({ video: result.output[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => console.log("Server running"));
