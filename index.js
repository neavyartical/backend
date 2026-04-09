import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ✅ SINGLE CLEAN ROUTE
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt:", prompt);

  try {
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    return res.json({
      url: imageUrl
    });

  } catch (err) {
    console.error(err);
    return res.json({ error: "Failed" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 BACKEND FIXED & WORKING");
});
