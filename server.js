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

    const lower = prompt.toLowerCase();

    /* 🔥 SMART PROMPT BOOST */
    let systemPrompt = `
You are a powerful AI content generator.

Always respond with:
- detailed output
- creative ideas
- no short answers

If it's a story → make it engaging and viral.
If it's a video → generate a full script + scenes.
If it's an idea → give multiple ideas.
`;

    /* 🔥 CALL OPENROUTER */
    let result = "";

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
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      console.log("API:", data);

      if (data.error) {
        result = "❌ API Error: " + data.error.message;
      } else {
        result = data.choices?.[0]?.message?.content || "⚠️ No AI output";
      }

    } catch (err) {
      console.error(err);
      result = "❌ AI failed";
    }

    /* 🎬 VIDEO MODE (REALISTIC) */
    if (/(video|movie|clip)/.test(lower)) {
      result = "🎬 VIDEO SCRIPT:\n\n" + result;
    }

    /* 🖼 IMAGE MODE (PROMPT-BASED, NOT RANDOM) */
    let image = null;

    if (/(image|photo|picture|draw)/.test(lower)) {
      const encoded = encodeURIComponent(prompt);
      image = `https://image.pollinations.ai/prompt/${encoded}`;
    }

    res.json({ result, image });

  } catch (err) {
    console.error(err);
    res.json({ result: "❌ Server error" });
  }
});

app.listen(10000, () => console.log("🚀 Server running"));
