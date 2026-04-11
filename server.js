import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* 👑 CHANGE THIS TO YOUR EMAIL */
const OWNER_EMAIL = "artical@example.com";

/* TEMP DATABASE */
let users = {};

/* ROOT */
app.get("/", (req, res) => {
  res.send("ReelMind Backend Running 🚀");
});

/* REGISTER */
app.post("/register", (req, res) => {
  const { email } = req.body;

  if (!users[email]) {
    users[email] = {
      credits: email === OWNER_EMAIL ? "unlimited" : 10
    };
  }

  res.json(users[email]);
});

/* USE CREDIT */
app.post("/use-credit", (req, res) => {
  const { email } = req.body;

  if (!users[email]) return res.json({ error: "User not found" });

  if (email === OWNER_EMAIL) {
    return res.json({ credits: "unlimited" });
  }

  if (users[email].credits <= 0) {
    return res.json({ error: "No credits left" });
  }

  users[email].credits -= 1;

  res.json({ credits: users[email].credits });
});

/* GENERATE (STRICT MODE) */
app.post("/generate", async (req, res) => {
  try {
    const { prompt, mode = "story" } = req.body;

    let story = "";
    let image = "";
    let video = "";

    if (mode === "story") {
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
              { role: "user", content: `Write a cinematic story: ${prompt}` }
            ]
          })
        });

        const data = await response.json();
        story = data.choices?.[0]?.message?.content || story;
      }
    }

    else if (mode === "image") {
      image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;
    }

    else if (mode === "video") {
      video = "";
    }

    else if (mode === "all") {
      story = `🔥 ${prompt}`;
      image = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/400`;
    }

    res.json({ story, image, video });

  } catch {
    res.json({ story: "", image: "", video: "" });
  }
});

/* ASK */
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

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
          messages: [{ role: "user", content: question }]
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
