const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const user = req.body.message;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENAI_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: user }
        ]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    res.json({
      reply: "⚠️ Error connecting to AI"
    });
  }
});

app.get("/", (req, res) => {
  res.send("ReelMind AI Backend Running ✅");
});

app.listen(3000, () => console.log("Server running on port 3000"));
