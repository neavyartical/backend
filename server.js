require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const multer = require("multer");
const http = require("http");

/* =========================
   SOCIAL ROUTES
========================= */
const videoRoutes = require("./routes/video");
const messageRoutes = require("./routes/message");
const callRoutes = require("./routes/call");
const socketServer = require("./socket/socketServer");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

const upload = multer({
  storage: multer.memoryStorage()
});

const ADMIN_EMAIL = "neavyartical@gmail.com";
const requestLimiter = new Map();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   API ROUTES
========================= */
app.use("/videos", videoRoutes);
app.use("/messages", messageRoutes);
app.use("/calls", callRoutes);

/* =========================
   ANTI ABUSE
========================= */
function antiAbuse(req, res, next) {
  const key = req.headers.authorization || req.ip;
  const now = Date.now();
  const previous = requestLimiter.get(key);

  if (previous && now - previous < 3000) {
    return res.status(429).json({
      error: "Please wait before sending another request."
    });
  }

  requestLimiter.set(key, now);

  setTimeout(() => {
    requestLimiter.delete(key);
  }, 60000);

  next();
}

/* =========================
   FIREBASE INIT
========================= */
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
      })
    });

    console.log("Firebase connected");
  } catch {
    console.log("Firebase skipped");
  }
}

/* =========================
   MONGO INIT
========================= */
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Mongo connected"))
    .catch(err => console.log(err.message));
}

/* =========================
   MODELS
========================= */
const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  credits: { type: Number, default: 50 },
  requests: { type: Number, default: 0 },
  country: { type: String, default: "Unknown" },
  city: { type: String, default: "Unknown" }
});

const transactionSchema = new mongoose.Schema({
  email: String,
  type: String,
  amount: Number,
  description: String,
  date: { type: Date, default: Date.now }
});

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

/* =========================
   COSTS
========================= */
const COSTS = {
  text: 1,
  image: 2,
  video: 5
};

/* =========================
   PROMPT ENHANCER
========================= */
function improvePrompt(prompt, mode) {
  const originalPrompt = String(prompt || "").trim();

  if (!originalPrompt) return "";

  if (mode === "image") {
    return `
${originalPrompt}

IMPORTANT:
Keep the user's exact subject.
Keep the original scene.
Do not change the request.
Do not add unrelated objects.
Follow the prompt closely.

STYLE:
masterpiece,
best quality,
ultra realistic,
photorealistic,
highly detailed,
sharp focus,
cinematic lighting,
professional photography,
natural skin texture,
correct anatomy,
realistic proportions,
depth of field,
high contrast,
8k detail

NEGATIVE:
blurry,
deformed,
extra fingers,
extra limbs,
duplicate face,
bad anatomy,
crooked eyes,
watermark,
logo,
random text,
distorted body
`.trim();
  }

  if (mode === "video") {
    return `
${originalPrompt}

IMPORTANT:
Keep the user's exact scene.

STYLE:
cinematic motion,
smooth camera movement,
natural movement,
professional lighting,
film quality,
high detail
`.trim();
  }

  if (mode === "text") {
    return `
${originalPrompt}

Write professionally using:
correct grammar,
natural wording,
immersive storytelling,
clear structure
`.trim();
  }

  return originalPrompt;
}

/* =========================
   HELPERS
========================= */
async function logTransaction(email, type, amount, description) {
  try {
    await Transaction.create({
      email,
      type,
      amount,
      description
    });
  } catch {}
}

async function deductCredits(user, amount, mode) {
  if (!user) return true;
  if (user.email === ADMIN_EMAIL) return true;
  if (user.credits < amount) return false;

  user.credits -= amount;
  user.requests += 1;

  await user.save();

  await logTransaction(
    user.email,
    "Generation",
    -amount,
    `${mode} generation`
  );

  return true;
}

/* =========================
   AUTH
========================= */
async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ uid: decoded.uid });

    if (!user) {
      user = await User.create({
        uid: decoded.uid,
        email: decoded.email
      });
    }

    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
}

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "ReelMind backend running"
  });
});

/* =========================
   PROFILE
========================= */
app.get("/me", auth, (req, res) => {
  res.json({
    email: req.user?.email || "",
    credits:
      req.user?.email === ADMIN_EMAIL
        ? "∞"
        : req.user?.credits || 0,
    country: req.user?.country || "Unknown",
    city: req.user?.city || "Unknown"
  });
});

/* =========================
   GENERATE IMAGE
========================= */
app.post("/generate-image", antiAbuse, auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.image, "Image");

  if (!allowed) {
    return res.status(403).json({
      error: "Not enough credits"
    });
  }

  const improvedPrompt = improvePrompt(req.body.prompt, "image");

  const imageUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(improvedPrompt)}` +
    `?width=1024&height=1024&seed=${Date.now()}&enhance=true&nologo=true&private=true`;

  res.json({
    data: {
      url: imageUrl
    }
  });
});

/* =========================
   EDIT IMAGE
========================= */
app.post("/edit-image", antiAbuse, auth, upload.single("image"), async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.image, "Image Edit");

  if (!allowed) {
    return res.status(403).json({
      error: "Not enough credits"
    });
  }

  const improvedPrompt = improvePrompt(
    req.body.prompt || "Enhance this image",
    "image"
  );

  const imageUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(improvedPrompt)}` +
    `?width=1024&height=1024&seed=${Date.now()}&enhance=true&nologo=true&private=true`;

  res.json({
    data: {
      url: imageUrl
    }
  });
});

/* =========================
   START SERVER
========================= */
socketServer(server);

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
