import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("FINAL VERSION 🚀");
});

// ✅ TEST ROUTE (NO JWT, NO ERROR POSSIBLE)
app.get("/test-token", (req, res) => {
  res.send("TEST TOKEN WORKING ✅");
});

// ✅ START
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
