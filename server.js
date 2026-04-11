import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ROOT */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* GENERATE */
app.post("/generate", async (req, res) => {
  try {
    const { prompt, mode = "all", language = "english" } = req.body;

    let story = "";
    let image = "";
    let video = "";

    let style = "Write a cinematic viral story:";
    if (language === "krio") {
      style = "Write simple easy English story:";
    }

    /* STORY */
    if (mode === "story" || mode === "all") {
      story = `🔥 ${prompt}`;

      if (process.env.OPENROUTER_API_KEY) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              { role: "user", content: `${style} ${prompt}` }
            ]
          })
        });

        const data = await response.json();
        story = data.choices?.[0]?.message?.content || story;
      }
    }

    /* IMAGE */
    if (mode === "image" || mode === "all") {
      image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;
    }

    /* VIDEO */
    if (mode === "video" || mode === "all") {
      video = "";
    }

    res.json({ story, image, video });

  } catch (error) {
    res.status(500).json({
      story: "❌ Generation failed",
      image: "",
      video: ""
    });
  }
});

/* ASK */
app.post("/ask", async (req, res) => {
  try {
    const { question, language = "english" } = req.body;

    let prefix = "";
    if (language === "krio") {
      prefix = "Explain in simple English: ";
    }

    let answer = question;

    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prefix + question }]
        })
      });

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || answer;
    }

    res.json({ answer });

  } catch {
    res.json({ answer: "❌ AI not responding" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
