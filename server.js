const express = require("express");
const path = require("path");

const app = express();

// Serve frontend
app.use(express.static("public"));

// Always load index.html
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running");
});
