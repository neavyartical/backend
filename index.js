import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt:", prompt);

  try {
    // 🔥 FREE AI IMAGE API (NO KEY NEEDED)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    res.json({
      url: imageUrl
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "Failed" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 WORKING AI BACKEND (NO LIMITS)");
});
