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
const JWT_SECRET = process.env.JWT_SECRET || "super_secret";

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err.message));

// ===== MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  email: { type: String, unique: true },
  credits: { type: Number, default: 100 },
  referrals: { type: Number, default: 0 },
  premium: { type: Boolean, default: false }
}));

// ===== HELPERS =====
function success(res, data) {
  return res.json({ status: "success", data });
}

function fail(res, message = "Error", code = 500) {
  return res.status(code).json({ status: "error", message });
}

// ===== AUTH =====
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return fail(res, "No token", 401);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("🚀 ReelMind Backend Live");
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return fail(res, "Email required", 400);

  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  return success(res, {
    token,
    email: user.email,
    credits: user.credits,
    referrals: user.referrals
  });
});

// ===== GET USER DASHBOARD =====
app.get("/me", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  return success(res, user);
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
        messages: [{ role: "user", content: req.body.prompt }]
      })
    });

    const data = await response.json();

    return success(res, {
      content: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch {
    return fail(res, "AI failed");
  }
});

// ===== IMAGE =====
app.post("/generate-image", auth, async (req, res) => {
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}?seed=${Math.random()}`;

    return success(res, { url });

  } catch {
    return fail(res, "Image failed");
  }
});

// ===== VIDEO (PLACEHOLDER - READY FOR RUNWAY) =====
app.post("/generate-video", auth, async (req, res) => {
  return success(res, {
    url: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
  });
});

// ===== REFERRAL SYSTEM =====
app.post("/referral", auth, async (req, res) => {
  const { code } = req.body;

  const refUser = await User.findOne({ email: code });
  if (!refUser) return fail(res, "Invalid referral");

  await User.updateOne(
    { email: refUser.email },
    { $inc: { referrals: 1, credits: 20 } }
  );

  return success(res, { message: "Referral applied" });
});

// ===== START =====
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});
