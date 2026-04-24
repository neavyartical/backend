require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");

const socketHandler = require("./socket/socketHandler");
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
const MONGO_URI = process.env.MONGO_URI || "";

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json({
  limit: "50mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "50mb"
}));

/* =========================
   FIREBASE TOKEN VERIFY
========================= */
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split("Bearer ")[1];

    const decodedToken = await admin
      .auth()
      .verifyIdToken(token);

    req.user = decodedToken;
  } catch (error) {
    console.log("Firebase auth skipped:", error.message);
  }

  next();
}

app.use(verifyFirebaseToken);

/* =========================
   DATABASE CONNECT
========================= */
async function connectDatabase() {
  if (!MONGO_URI) {
    console.warn("MONGO_URI not provided");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB error:", error.message);
  }
}

/* =========================
   HEALTH ROUTES
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
    success: true,
    server: "online",
    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    firebase: "ready",
    time: new Date()
  });
});

/* =========================
   SAFE ROUTE LOADER
========================= */
function loadRoute(routePath, filePath) {
  try {
    app.use(routePath, require(filePath));
    console.log(`Loaded route: ${routePath}`);
  } catch (error) {
    console.warn(`Skipped route ${routePath}:`, error.message);
  }
}

/* =========================
   API ROUTES
========================= */
loadRoute("/auth", "./routes/auth");
loadRoute("/messages", "./routes/messageRoutes");
loadRoute("/feed", "./routes/feedRoutes");
loadRoute("/ai", "./routes/aiRoutes");

/* =========================
   NOT FOUND
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

/* =========================
   SOCKET INITIALIZATION
========================= */
socketHandler(server);

/* =========================
   START SERVER
========================= */
async function startServer() {
  await connectDatabase();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

/* =========================
   GRACEFUL SHUTDOWN
========================= */
async function gracefulShutdown(signal) {
  console.log(`${signal} received`);

  try {
    await mongoose.connection.close();
    console.log("MongoDB closed");
  } catch (error) {
    console.log("Shutdown warning:", error.message);
  }

  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
