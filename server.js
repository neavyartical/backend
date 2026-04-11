import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY;

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "❌ Please enter something" });
    }

    let result = "⚠️ No response";

    /* 🔥 TEXT (REAL AI) */
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      console.log("API:", data);

      if (data.error) {
        result = "❌ API Error: " + data.error.message;
      } else {
        result = data.choices?.[0]?.message?.content || "⚠️ Empty AI response";
      }

    } catch (err) {
      console.error(err);
      result = "❌ Failed to fetch AI";
    }

    /* 🔥 FEATURES */
    const lower = prompt.toLowerCase();

    let image = null;

    if (/(image|photo|picture|draw)/.test(lower)) {
      image = `https://picsum.photos/800/500?random=${Math.random()}`;
    }

    if (/(video|movie|clip)/.test(lower)) {
      result += "\n\n🎬 Video idea generated above (real video is premium feature)";
    }

    res.json({ result, image });

  } catch (err) {
    console.error(err);
    res.json({ result: "❌ Server error" });
  }
});

app.listen(10000, () => console.log("🚀 Server running"));
