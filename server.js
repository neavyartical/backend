import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Main API
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log("Prompt:", prompt);

    // TEMP RESPONSE (no API needed)
    res.json({
      result: "🔥 AI Response: " + prompt
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
