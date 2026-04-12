const express = require("express");

const app = express();

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// 🔥 OPENROUTER AI
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ result: "Please enter something." });
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
          { role: "system", content: "You are a viral content creator AI." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    res.json({
      result: data.choices?.[0]?.message?.content || "No response."
    });

  } catch (error) {
    res.json({
      result: "Error generating AI response."
    });
  }
});

// Health
app.get("/", (req, res) => {
  res.send("AI Backend running 🚀");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running...");
});
