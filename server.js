import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    const lower = prompt.toLowerCase();

    /* ========= TEXT ========= */
    let result = "";

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      result = data.choices?.[0]?.message?.content || "No response";
    } catch {
      result = "⚠️ AI text failed";
    }

    /* ========= IMAGE (SMART FALLBACK) ========= */
    let image = null;
    if (lower.includes("image") || lower.includes("photo") || lower.includes("picture")) {
      image = `https://picsum.photos/800/500?random=${Math.random()}`;
    }

    /* ========= VIDEO ========= */
    let video = null;
    if (lower.includes("video")) {
      video = "https://www.w3schools.com/html/mov_bbb.mp4";
    }

    res.json({ result, image, video });

  } catch (err) {
    console.error(err);
    res.json({ result: "Server error ❌" });
  }
});

app.listen(10000, () => console.log("🚀 Server running"));
