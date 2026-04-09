import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt:", prompt);

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "stability-ai/sdxl",   // ✅ NO version needed
        input: {
          prompt: prompt
        }
      })
    });

    const startData = await response.json();
    console.log("🚀 START:", startData);

    if (!startData.id) {
      return res.json({ error: startData });
    }

    let result;

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${startData.id}`,
        {
          headers: {
            "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );

      result = await check.json();
      console.log("⏳ Status:", result.status);

      if (result.status === "succeeded") break;
      if (result.status === "failed") {
        return res.json({ error: result });
      }
    }

    console.log("🎯 RESULT:", result);

    let outputUrl = null;

    if (Array.isArray(result.output)) {
      outputUrl = result.output[0];
    } else if (typeof result.output === "string") {
      outputUrl = result.output;
    }

    if (!outputUrl) {
      return res.json({ error: result });
    }

    res.json({
      url: outputUrl
    });

  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("🔥 FINAL BACKEND WORKING");
});
