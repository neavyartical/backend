const express = require("express");
const path = require("path");

const app = express();

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// API routes (optional)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// VERY IMPORTANT: Always send index.html for frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
