import express from "express";

const app = express();

/* ROOT CHECK */
app.get("/", (req, res) => {
  res.send("WORKING ✅ BACKEND LIVE");
});

app.listen(process.env.PORT || 10000);
