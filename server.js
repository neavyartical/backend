import express from "express";
import cors from "cors";

const app = express();

/* MIDDLEWARE (VERY IMPORTANT) */
app.use(cors());
app.use(express.json());

/* ROOT */
app.get("/", (req, res) => {
  res.send("🔥 BACKEND LIVE");
});

/* STORY ROUTE */
app.post("/story", (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt" });
    }

    res.json({
      success: true,
      story: `🔥 Cinematic story for: ${prompt}`
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* START SERVER */
app.listen(process.env.PORT || 10000, () => {
  console.log("Server running...");
});
