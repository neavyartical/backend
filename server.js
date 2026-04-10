app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    console.log("📩 Prompt:", prompt);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

    console.log("🔥 FULL API RESPONSE:", JSON.stringify(data, null, 2));

    // 🚨 HANDLE API ERRORS CLEARLY
    if (data.error) {
      return res.json({
        result: "API ERROR ❌: " + data.error.message
      });
    }

    // ✅ SUCCESS
    const reply = data.choices?.[0]?.message?.content;

    res.json({
      result: reply || "No response from AI"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    res.json({
      result: "Server error ❌",
      details: err.message
    });
  }
});
