import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.REPLICATE_API_TOKEN;

if (!API_KEY) {
  console.log("❌ API KEY MISSING");
} else {
  console.log("🔑 KEY LOADED ✅");
}

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    console.log("📩 Prompt:", prompt);

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "3f0457e7d6eaa92b7eac191f85632d436a3d79042f2f20c4afb77540182c212d",
        input: {
          prompt: prompt,
        },
      }),
    });

    const data = await response.json();
    console.log("🚀 Start:", data);

    let status = data;

    while (status.status !== "succeeded" && status.status !== "failed") {
      await new Promise(r => setTimeout(r, 3000));

      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${data.id}`,
        {
          headers: {
            Authorization: `Token ${API_KEY}`,
          },
        }
      );

      status = await check.json();
      console.log("⏳ Status:", status.status);
    }

    if (status.status === "succeeded") {
      res.json({ video: status.output[0] });
    } else {
      res.json({ error: "Generation failed" });
    }

  } catch (error) {
    console.log("❌ ERROR:", error);
    res.json({ error: "Server error" });
  }
});

app.listen(10000, () => {
  console.log("🚀 Server running on port 10000");
});
