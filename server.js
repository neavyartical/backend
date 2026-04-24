require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const socketServer = require("./socketServer");
const admin = require("./firebaseAdmin");

/* =========================
   APP SETUP
========================= */
const app = express();
const server = http.createServer(app);

/* =========================
   ENVIRONMENT
========================= */
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   FIREBASE AUTH VERIFICATION
========================= */
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) return next();

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;

    next();
  } catch (err) {
    console.log("Firebase auth skipped:", err.message);
    next();
  }
}

app.use(verifyFirebaseToken);

/* =========================
   DATABASE CONNECTION
========================= */
async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}

/* =========================
   HEALTH CHECK ROUTES
========================= */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    app: "ReelMind AI Backend",
    status: "running"
  });
});

app.get("/status", (req, res) => {
  res.status(200).json({
    server: "online",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    firebase: "ready",
    timestamp: new Date()
  });
});

/* =========================
   API ROUTES
========================= */
try { app.use("/auth", require("./routes/authRoutes")); } catch {}
try { app.use("/messages", require("./routes/messageRoutes")); } catch {}
try { app.use("/feed", require("./routes/feedRoutes")); } catch {}
try { app.use("/ai", require("./routes/aiRoutes")); } catch {}

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

/* =========================
   SOCKET.IO
========================= */
socketServer(server);

/* =========================
   START SERVER
========================= */
async function startServer() {
  await connectDatabase();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

/* =========================
   GRACEFUL SHUTDOWN
========================= */
process.on("SIGINT", async () => {
  console.log("Closing server...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await mongoose.connection.close();
  process.exit(0);
});
