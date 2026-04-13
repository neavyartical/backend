require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const ADMIN_EMAIL = "neavyartical@gmail.com";

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err.message));

// ===== MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  email: String,
  credits: { type: Number, default: 20 },
  premium: { type: Boolean, default: false }
}));

// ===== AUTH =====
function auth(req, res, next){
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({ error:"No token" });

  try{
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  }catch{
    res.status(401).json({ error:"Invalid token" });
  }
}

// ===== LOGIN =====
app.post("/login", async (req,res)=>{
  const { email } = req.body;
  if(!email) return res.json({ error:"Email required" });

  let user = await User.findOne({ email });
  if(!user) user = await User.create({ email });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn:"7d" });
  res.json({ token, user });
});

// ===== IMAGE (FIXED + FALLBACK) =====
app.post("/generate-image", auth, async (req,res)=>{
  try{
    const prompt = req.body.prompt;

    if(!prompt || prompt.trim()===""){
      return res.json({ error:"Prompt empty" });
    }

    // 🔥 MAIN IMAGE SOURCE (Pollinations)
    let image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random()*100000)}`;

    // ✅ ALWAYS RETURN IMAGE (no failure)
    res.json({
      image,
      source: "pollinations"
    });

  }catch(err){
    console.log(err);

    // 🔥 FALLBACK IMAGE (ALWAYS WORKS)
    const fallback = `https://picsum.photos/seed/${Math.random()}/1024/1024`;

    res.json({
      image: fallback,
      source: "fallback"
    });
  }
});

// ===== START =====
app.listen(PORT, ()=>{
  console.log("🚀 Server running on port " + PORT);
});
