import express from "express";

const app = express();
app.use(express.json());

/* ROOT */
app.get("/", (req, res) => {
  res.send("🔥 BACKEND LIVE");
});

/* STORY TEST */
app.post("/story", (req, res) => {
  const { prompt } = req.body;

  res.json({
    success: true,
    story: `This is a test story for: ${prompt}`
  });
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running...");
});
