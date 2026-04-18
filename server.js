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
const requestLimiter = new Map();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   ANTI ABUSE
========================= */
function antiAbuse(req, res, next) {
  const key = req.headers.authorization || req.ip;
  const now = Date.now();
  const previous = requestLimiter.get(key);

  if (previous && now - previous < 3000) {
    return res.status(429).json({
      error: "Please wait a few seconds before another request."
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

  clean = clean.replace(/reelmind/gi, "cinematic professional artwork");

  if (mode === "image") {
    clean = `
${clean},

masterpiece,
best quality,
ultra realistic,
photorealistic,
highly detailed,
sharp focus,
cinematic lighting,
studio lighting,
natural skin texture,
realistic eyes,
symmetrical face,
perfect anatomy,
correct hands,
correct fingers,
depth of field,
professional photography,
award winning composition,

negative prompt:
blurry,
low quality,
bad anatomy,
deformed face,
extra limbs,
extra fingers,
crooked eyes,
mutated hands,
duplicate face,
poor proportions,
distorted body,
random text,
watermark,
logo,
grainy,
oversaturated
`;
  }

  if (mode === "video") {
    clean = `
${clean},

cinematic motion,
smooth camera movement,
natural movement,
professional lighting,
realistic detail,
film quality
`;
  }

  if (mode === "text") {
    clean = `
${clean}

Write professionally with:
- correct grammar
- natural wording
- immersive storytelling
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
  } catch {}
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
   PROFILE
========================= */
app.get("/me", auth, (req, res) => {
  res.json({
    email: req.user?.email || "",
    credits: req.user?.email === ADMIN_EMAIL ? "∞" : (req.user?.credits || 0),
    country: req.user?.country || "Unknown",
    city: req.user?.city || "Unknown"
  });
});

/* =========================
   GENERATE TEXT
========================= */
app.post("/generate-text", antiAbuse, auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.text, "Text");
  if (!allowed) return res.status(403).json({ error: "Not enough credits" });

  try {
    const improvedPrompt = improvePrompt(req.body.prompt, "text");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: improvedPrompt }]
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
app.post("/generate-image", antiAbuse, auth, async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.image, "Image");
  if (!allowed) return res.status(403).json({ error: "Not enough credits" });

  const improvedPrompt = improvePrompt(req.body.prompt, "image");

  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(improvedPrompt)}` +
    `?width=1024&height=1024&enhance=true&nologo=true&private=true`;

  res.json({
    data: { url }
  });
});

/* =========================
   EDIT IMAGE
========================= */
app.post("/edit-image", antiAbuse, auth, upload.single("image"), async (req, res) => {
  const allowed = await deductCredits(req.user, COSTS.image, "Image Edit");
  if (!allowed) return res.status(403).json({ error: "Not enough credits" });

  const improvedPrompt = improvePrompt(req.body.prompt || "Enhance image", "image");

  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(improvedPrompt)}` +
    `?width=1024&height=1024&enhance=true&nologo=true&private=true`;

  res.json({
    data: { url }
  });
});

/* =========================
   START
========================= */
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
