require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

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
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
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
  requests: { type: Number, default: 0 }
});

const transactionSchema = new mongoose.Schema({
  email: String,
  type: String,
  amount: Number,
  description: String,
  date: {
    type: Date,
    default: Date.now
  }
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
   LOG TRANSACTION
========================= */
async function logTransaction(email, type, amount, description){
  try{
    await Transaction.create({
      email,
      type,
      amount,
      description
    });
  }catch{}
}

/* =========================
   DEDUCT CREDITS
========================= */
async function deductCredits(user, amount, mode){
  if(!user) return true;

  if(user.credits < amount){
    return false;
  }

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
async function auth(req, res, next){
  try{
    const token = (req.headers.authorization || "").replace("Bearer ", "");

    if(!token){
      req.user = null;
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ uid: decoded.uid });

    if(!user){
      user = await User.create({
        uid: decoded.uid,
        email: decoded.email
      });
    }

    req.user = user;
    next();

  }catch{
    req.user = null;
    next();
  }
}

/* =========================
   ADMIN PROTECTION
========================= */
function adminOnly(req, res, next){
  if(!req.user || req.user.email !== ADMIN_EMAIL){
    return res.status(403).json({
      error: "Access denied"
    });
  }

  next();
}

/* =========================
   ROOT
========================= */
app.get("/", (req, res)=>{
  res.json({
    status: "ReelMind backend running"
  });
});

/* =========================
   PROFILE
========================= */
app.get("/me", auth, (req, res)=>{
  if(!req.user){
    return res.json({
      email: "Guest",
      credits: 0
    });
  }

  res.json({
    email: req.user.email,
    credits: req.user.credits
  });
});

/* =========================
   TRANSACTIONS
========================= */
app.get("/transactions", auth, async (req, res)=>{
  if(!req.user){
    return res.json([]);
  }

  try{
    const transactions = await Transaction.find({
      email: req.user.email
    })
    .sort({ date: -1 })
    .limit(20);

    res.json(transactions);

  }catch{
    res.status(500).json({
      error: "Failed to load transactions"
    });
  }
});

/* =========================
   ADMIN DASHBOARD
========================= */
app.get("/admin-dashboard", auth, adminOnly, async (req, res)=>{
  try{
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    const totalGenerations = await Transaction.countDocuments({
      type: "Generation"
    });

    const payments = await Transaction.find({
      type: "Payment"
    });

    const totalRevenue = payments.reduce((sum, item)=>{
      if(item.amount >= 9999) return sum + 25;
      if(item.amount >= 150) return sum + 12;
      if(item.amount >= 50) return sum + 5;
      return sum;
    },0);

    const recentUsers = await User.find()
      .sort({ _id: -1 })
      .limit(10)
      .select("email credits requests");

    res.json({
      totalUsers,
      totalTransactions,
      totalGenerations,
      totalRevenue,
      recentUsers
    });

  }catch{
    res.status(500).json({
      error: "Dashboard failed"
    });
  }
});

/* =========================
   PAYMENT WEBHOOK
========================= */
app.post("/payment-webhook", async (req, res)=>{
  try{
    const email = req.body.email;
    const amount = Number(req.body.amount || 0);

    if(!email){
      return res.status(400).json({
        error: "Missing email"
      });
    }

    let creditsToAdd = 0;

    if(amount >= 25){
      creditsToAdd = 9999;
    }else if(amount >= 12){
      creditsToAdd = 150;
    }else if(amount >= 5){
      creditsToAdd = 50;
    }

    const user = await User.findOne({ email });

    if(user){
      user.credits += creditsToAdd;
      await user.save();

      await logTransaction(
        email,
        "Payment",
        creditsToAdd,
        "Credits purchased"
      );
    }

    res.json({
      success: true,
      added: creditsToAdd
    });

  }catch{
    res.status(500).json({
      error: "Webhook failed"
    });
  }
});

/* =========================
   GENERATE TEXT
========================= */
app.post("/generate-text", auth, async (req, res)=>{
  const allowed = await deductCredits(req.user, COSTS.text, "Text");

  if(!allowed){
    return res.status(403).json({ error: "Not enough credits" });
  }

  try{
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Write cinematic immersive stories." },
          { role: "user", content: req.body.prompt }
        ]
      }),
      timeout: 15000
    });

    const data = await response.json();

    res.json({
      data:{
        content: data?.choices?.[0]?.message?.content || "No response"
      }
    });

  }catch{
    res.json({
      data:{
        content: "Story generation failed"
      }
    });
  }
});

/* =========================
   GENERATE IMAGE
========================= */
app.post("/generate-image", auth, async (req, res)=>{
  const allowed = await deductCredits(req.user, COSTS.image, "Image");

  if(!allowed){
    return res.status(403).json({ error: "Not enough credits" });
  }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}`;

  res.json({
    data:{ url }
  });
});

/* =========================
   GENERATE VIDEO
========================= */
app.post("/generate-video", auth, async (req, res)=>{
  const allowed = await deductCredits(req.user, COSTS.video, "Video");

  if(!allowed){
    return res.status(403).json({ error: "Not enough credits" });
  }

  try{
    const response = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06"
      },
      body: JSON.stringify({
        model: "gen4.5",
        promptText: req.body.prompt,
        ratio: "1280:720",
        duration: 5
      }),
      timeout: 20000
    });

    const data = await response.json();

    res.json({
      taskId: data?.id || null,
      preview: data?.output?.[0] || null
    });

  }catch{
    res.json({
      error: "Video generation failed"
    });
  }
});

/* =========================
   VIDEO STATUS
========================= */
app.get("/video-status/:taskId", async (req, res)=>{
  try{
    const response = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}`,
      {
        headers:{
          Authorization:`Bearer ${process.env.RUNWAY_API_KEY}`,
          "X-Runway-Version":"2024-11-06"
        },
        timeout:10000
      }
    );

    const data = await response.json();

    res.json({
      status: data?.status || "processing",
      video: data?.output?.[0] || null
    });

  }catch{
    res.json({
      status:"failed",
      video:null
    });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, HOST, ()=>{
  console.log(`Server running on ${HOST}:${PORT}`);
});
