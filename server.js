const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Serve frontend (VERY IMPORTANT)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Test API route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK 🚀" });
});

// ✅ Default route (loads your app)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
