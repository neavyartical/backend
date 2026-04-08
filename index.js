const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  console.log("Prompt:", prompt);

  // TEMP VIDEO (for testing)
  res.json({
    video: "https://www.w3schools.com/html/mov_bbb.mp4"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
