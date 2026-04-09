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
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45b6a8e53d2b6c5b3a3bde7cdb3c7d1b8e8d1e6c2c7e0a6c7d5f7c9f3f5",
        input: { prompt }
      })
    });

    const data = await start.json();
    console.log("🚀 Start:", data);

    if (!data.id) {
      return res.json({ error: data });
    }

    let result;

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${data.id}`,
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

    console.log("🎯 Result:", result);

    // 🔥 IMPORTANT FIX
    let outputUrl = null;

    if (Array.isArray(result.output)) {
      outputUrl = result.output[0];
    } else if (typeof result.output === "string") {
      outputUrl = result.output;
    }

    if (!outputUrl) {
      return res.json({
        error: "No output",
        raw: result
      });
    }

    // ✅ ALWAYS RETURN url (not video)
    res.json({
      url: outputUrl
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "Failed" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 Backend ready");
});
