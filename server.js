
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
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ result: "Enter a prompt ❌" });
    }

    const lower = prompt.toLowerCase();

    /* ================= TEXT (ALWAYS) ================= */
    let resultText = "";

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      resultText = data.choices?.[0]?.message?.content || "No response";
    } catch {
      resultText = "⚠️ AI text failed, but other outputs may still work";
    }

    /* ================= IMAGE ================= */
    let image = null;
    if (
      lower.includes("image") ||
      lower.includes("photo") ||
      lower.includes("picture")
    ) {
      image = `https://picsum.photos/600/400?random=${Math.random()}`;
    }

    /* ================= VIDEO ================= */
    let video = null;
    if (lower.includes("video")) {
      video = "https://www.w3schools.com/html/mov_bbb.mp4";
    }

    /* ================= RESPONSE ================= */
    res.json({
      result: resultText,
      image,
      video
    });

  } catch (err) {
    console.error(err);
    res.json({ result: "Server error ❌" });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
