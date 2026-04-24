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
const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || "";

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb"
  })
);

/* =========================
   FIREBASE AUTH
========================= */
async function verifyFirebaseToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return next();
    }

    const token = header.slice(7);

    const decoded = await admin
      .auth()
      .verifyIdToken(token);

    req.user = decoded;
  } catch (error) {
    console.log("Firebase auth skipped:", error.message);
  }

  next();
}

app.use(verifyFirebaseToken);

/* =========================
   DATABASE
========================= */
async function connectDatabase() {
  if (!MONGO_URI) {
    console.warn("MONGO_URI missing");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
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
    server: "online",
    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    firebase: "ready",
    timestamp: new Date()
  });
});

/* =========================
   SAFE ROUTE LOADER
========================= */
function loadRoute(path, file) {
  try {
    app.use(path, require(file));
    console.log(`Loaded route ${path}`);
  } catch (error) {
    console.warn(`Failed route ${path}:`, error.message);
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
   404
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
   SOCKET.IO
========================= */
socketServer(server);

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
   SHUTDOWN
========================= */
async function shutdown(signal) {
  console.log(`${signal} received`);

  try {
    await mongoose.connection.close();
  } catch {}

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
