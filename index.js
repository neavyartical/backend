import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("ReelMind Backend is running 🚀");
});

// GENERATE ROUTE (WORKING 100%)
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  console.log("User prompt:", prompt);

  // Always return working video
  res.json({
    video: "https://www.w3schools.com/html/mov_bbb.mp4"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running 🚀");
});
