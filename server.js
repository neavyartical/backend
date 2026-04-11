
import express from "express";

const app = express();

/* ROOT ROUTE */
app.get("/", (req, res) => {
  res.send("🔥 BACKEND FIXED AND WORKING");
});

/* TEST ROUTE */
app.get("/test", (req, res) => {
  res.json({ status: "OK ✅" });
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running...");
});
