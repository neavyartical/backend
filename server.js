import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("KEY:", OPENROUTER_API_KEY ? "SET ✅" : "MISSING ❌");

app.post("/generate", async (req, res) => {
  try {
    const { prompt, type } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    // 🧠 TEXT GENERATION
    if (type === "text") {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openchat/openchat-7b",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();

      return res.json({
        type: "text",
        result: data.choices?.[0]?.message?.content || "No response"
      });
    }

    // 🖼️ IMAGE GENERATION (🔥 FIXED)
    if (type === "image") {

      // prevent caching by adding random seed
      const seed = Math.floor(Math.random() * 100000);

      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&nologo=true`;

      return res.json({
        type: "image",
        result: imageUrl
      });
    }

    // 🎬 VIDEO GENERATION (SMART RESPONSE)
    if (type === "video") {
      return res.json({
        type: "video",
        result:
`🎬 Viral Video Plan:

${prompt}

🎥 Structure:
1. Hook (0-3 sec)
2. Main Content
3. Twist / Surprise
4. Call To Action

📱 Tools:
- CapCut
- TikTok Editor

🔥 Tip:
Use fast cuts + captions + trending sound`
      });
    }

  } catch (err) {
    console.error(err);
    res.json({ result: "Server error ❌" });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
