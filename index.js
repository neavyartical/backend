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

// Generate image
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  console.log("📩 Prompt:", prompt);

  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

  res.json({
    url: imageUrl
  });
});

app.listen(PORT, () => {
  console.log("🔥 Backend working perfectly");
});
