import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());

/* ===== ROOT ===== */
app.get("/", (req, res) => {
  res.send("🔥 ReelMind Backend Live");
});

/* ===== AI STORY ===== */
app.post("/story", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ story: "❌ No prompt provided" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_REAL_OPENROUTER_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You create viral, cinematic, emotional stories."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    console.log("AI RESPONSE:", data); // 🔥 SEE ERRORS IN RENDER

    /* HANDLE ERRORS CLEARLY */
    if (data.error) {
      return res.json({
        story: "❌ " + data.error.message
      });
    }

    if (!data.choices) {
      return res.json({
        story: "⚠️ No response from AI"
      });
    }

    /* SUCCESS */
    res.json({
      story: data.choices[0].message.content
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({
      story: "❌ Server crashed"
    });
  }
});

/* ===== START SERVER ===== */
app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 Server running...");
});
