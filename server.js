const express = require("express");

const app = express();

// 🔥 MEMORY STORAGE
let conversation = [];

app.use(express.json());

// CORS (allow frontend)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// 🔥 AI ROUTE WITH MEMORY
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ result: "Enter something." });
  }

  // add user message
  conversation.push({ role: "user", content: prompt });

  // keep only last 10 messages
  if (conversation.length > 10) {
    conversation.shift();
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "You are ReelMind AI. Create viral, engaging content." },
          ...conversation
        ]
      })
    });

    const data = await response.json();

    const reply = data?.choices?.[0]?.message?.content || "No response.";

    // save AI reply
    conversation.push({ role: "assistant", content: reply });

    return res.json({ result: reply });

  } catch (error) {
    console.error(error);
    return res.json({
      result: "Error generating AI response."
    });
  }
});

// 🔥 RESET MEMORY
app.post("/reset", (req, res) => {
  conversation = [];
  res.json({ result: "Memory cleared." });
});

// ROOT (Render health)
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
