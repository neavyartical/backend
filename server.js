app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    // TEMP response (to test connection)
    res.json({
      result: "🔥 Working! You said: " + prompt
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
