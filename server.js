require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";
const upload = multer({ storage: multer.memoryStorage() });

const ADMIN_EMAIL = "neavyartical@gmail.com";

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

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

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

/* =========================
   COSTS
========================= */
const COSTS = {
  text: 1,
  image: 2,
  video: 5
};

/* =========================
   PROMPT IMPROVER
========================= */
function improvePrompt(prompt, mode) {
  let clean = String(prompt || "").trim();

  clean = clean.replace(/reelmind/gi, "cinematic scene");

  if (mode === "image") {
    clean = `
${clean},
ultra realistic,
highly detailed,
professional photography,
cinematic lighting,
natural skin texture,
symmetrical face,
sharp eyes,
clean background,
correct anatomy,
realistic proportions,
high resolution,
8k quality,
masterpiece,
no distorted face,
no duplicate face,
no extra eyes,
no extra fingers,
no broken hands,
no malformed body,
no random letters,
no text,
no watermark,
no logo,
no blur
`;
  }

  if (mode === "video") {
    clean = `
${clean},
cinematic motion,
smooth camera movement,
realistic lighting,
professional film quality,
natural movement,
high detail,
no distortion
`;
  }

  if (mode === "text") {
    clean = `
${clean}

Write professionally with correct grammar, natural wording, and immersive storytelling.
`;
  }

  return clean.trim();
}

/* =========================
   HELPERS
========================= */
async function logTransaction(email, type, amount, description) {
  try {
    await Transaction.create({ email, type, amount, description });
  } catch {
    console.log("Transaction log failed");
  }
}

async function deductCredits(user, amount, mode) {
  if (!user) return true;
  if (user.email === ADMIN_EMAIL) return true;
  if (user.credits < amount) return false;

  user.credits -= amount;
  user.requests += 1;
  await user.save();

  await logTransaction(user.email, "Generation", -amount, `${mode} generation`);
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
  res.json({ status: "ReelMind backend running" });
});

/* =========================
   PROFILE
========================= */
app.get("/me", auth, (req, res) => {
  if (!req.user) {
    return res.json({
      email: "",
      credits: 0,
      country: "Unknown",
      city: "Unknown"
    });
  }

  res.json({
    email: req.user.email,
    credits: req.user.email === ADMIN_EMAIL ? "∞" : req.user.credits,
    country: req.user.country,
    city: req.user.city
  });
});

/* =========================
   GENERATE TEXT
========================= */
app.post("/generate-text", auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.text, "Text");
  if (!allowed) return res.status(403).json({ error: "Not enough credits" });

  const improvedPrompt = improvePrompt(req.body.prompt, "text");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Write cinematic immersive stories."
          },
          {
            role: "user",
            content: improvedPrompt
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      data: {
        content: data?.choices?.[0]?.message?.content || "No response"
      }
    });

  } catch {
    res.json({
      data: {
        content: "Story generation failed"
      }
    });
  }
});

/* =========================
   GENERATE IMAGE
========================= */
app.post("/generate-image", auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.image, "Image");
  if (!allowed) return res.status(403).json({ error: "Not enough credits" });

  const improvedPrompt = improvePrompt(req.body.prompt, "image");

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(improvedPrompt)}?width=1024&height=1024&nologo=true`;

  res.json({
    data: { url }
  });
});

/* =========================
   EDIT IMAGE
========================= */
app.post("/edit-image", auth, upload.single("image"), async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.image, "Image Edit");
  if (!allowed) return res.status(403).json({ error: "Not enough credits" });

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const improvedPrompt = improvePrompt(req.body.prompt || "Enhance image", "image");

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(improvedPrompt)}?width=1024&height=1024&nologo=true`;

    res.json({
      data: { url }
    });

  } catch {
    res.status(500).json({
      error: "Image editing failed"
    });
  }
});

/* =========================
   GENERATE VIDEO
========================= */
app.post("/generate-video", auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.video, "Video");
  if (!allowed) return res.status(403).json({ error: "Not enough credits" });

  const improvedPrompt = improvePrompt(req.body.prompt, "video");

  try {
    const response = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06"
      },
      body: JSON.stringify({
        model: "gen4.5",
        promptText: improvedPrompt,
        ratio: "1280:720",
        duration: 5
      })
    });

    const data = await response.json();

    res.json({
      taskId: data?.id || null,
      preview: data?.output?.[0] || null
    });

  } catch {
    res.json({
      error: "Video generation failed"
    });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
