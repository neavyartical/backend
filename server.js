require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// ===== REQUEST TRACKING =====
app.use((req, res, next) => {
  req.startTime = Date.now();
  req.requestId = "rm_" + Date.now();
  next();
});

// ===== RESPONSE HELPERS =====
function success(res, req, type, data = {}, extra = {}) {
  return res.json({
    status: "success",
    type,
    data,
    meta: {
      request_id: req.requestId,
      time: (Date.now() - req.startTime) / 1000,
      ...extra
    }
  });
}

function fail(res, req, message = "Error", code = 500) {
  return res.status(code).json({
    status: "error",
    message,
    code
  });
}

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err.message));

// ===== MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  email: { type: String, unique: true },
  credits: { type: Number, default: 100 },
  premium: { type: Boolean, default: false }
}));

// ===== AUTH FIXED =====
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return fail(res, req, "No token", 401);

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return fail(res, req, "Invalid token", 401);
  }
}

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("🚀 ReelMind Backend Live");
});

// ===== LOGIN (FIXED FORMAT) =====
app.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!email) return fail(res, req, "Email required", 400);

  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  // 🔥 IMPORTANT FIX
  return success(res, req, "auth", {
    token: token,
    email: user.email
  });
});

// ===== TEXT =====
app.post("/generate-text", auth, async (req, res) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: req.body.prompt
        }]
      })
    });

    const data = await response.json();

    return success(res, req, "text", {
      content: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch {
    return fail(res, req, "AI failed");
  }
});

// ===== IMAGE (FIXED) =====
app.post("/generate-image", auth, async (req, res) => {
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}?seed=${Math.random()}`;

    return success(res, req, "image", { url });

  } catch {
    return fail(res, req, "Image failed");
  }
});

// ===== VIDEO =====
app.post("/generate-video", auth, async (req, res) => {
  return success(res, req, "video", {
    url: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
  });
});

// ===== START =====
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});
