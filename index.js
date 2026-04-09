import express from "express";
import cors from "cors";

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
    const start = await fetch(
      "https://api.replicate.com/v1/models/stability-ai/sdxl/predictions",
      {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: {
            prompt: prompt
          }
        })
      }
    );

    const startData = await start.json();
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
    }

    console.log("🎯 RESULT:", result);

    let url = null;

    if (Array.isArray(result.output)) {
      url = result.output[0];
    } else if (typeof result.output === "string") {
      url = result.output;
    }

    if (!url) {
      return res.json({ error: result });
    }

    res.json({ url });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("🔥 NODE 22 CLEAN BACKEND RUNNING");
});
