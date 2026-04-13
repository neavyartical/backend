require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("✅ MongoDB Connected"))
  .catch(err=>console.log("❌ DB Error:", err.message));

// ===== MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  email:String,
  credits:{type:Number,default:50},
  premium:{type:Boolean,default:false},
  earnings:{type:Number,default:0}
}));

// ===== ROOT =====
app.get("/", (req,res)=>{
  res.send("🚀 ReelMind AI Backend LIVE");
});

// ===== AUTH =====
function auth(req,res,next){
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({error:"No token"});

  try{
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  }catch{
    res.status(401).json({error:"Invalid token"});
  }
}

// ===== LOGIN =====
app.post("/login", async (req,res)=>{
  const {email} = req.body;

  let user = await User.findOne({email});
  if(!user) user = await User.create({email});

  const token = jwt.sign({email}, JWT_SECRET, {expiresIn:"7d"});

  res.json({token,user});
});

// ===== TEXT AI =====
app.post("/generate-text", auth, async (req,res)=>{
  try{
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+process.env.OPENROUTER_API_KEY,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        model:"openai/gpt-3.5-turbo",
        messages:[{role:"user",content:req.body.prompt}]
      })
    });

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content || "No response";

    res.json({result});

  }catch(err){
    console.log(err);
    res.json({error:"AI failed"});
  }
});

// ===== IMAGE (ALWAYS WORKS) =====
app.post("/generate-image", auth, async (req,res)=>{
  try{
    const prompt = req.body.prompt;

    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Math.random()}`;
    const fallback = `https://picsum.photos/800?random=${Math.random()}`;

    res.json({image, fallback});

  }catch{
    res.json({
      image:`https://picsum.photos/800?random=${Math.random()}`
    });
  }
});

// ===== VIDEO (NEW ROUTE) =====
app.post("/generate-video", auth, async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // Demo video (replace later with Runway / Pika API)
    const video = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";

    res.json({
      video,
      message: "Demo video — connect real AI API later"
    });

  } catch (err) {
    res.json({ error: "Video generation failed" });
  }
});

// ===== REEL =====
app.post("/generate-reel", auth, async (req,res)=>{
  try{
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+process.env.OPENROUTER_API_KEY,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        model:"openai/gpt-3.5-turbo",
        messages:[{role:"user",content:"Create viral reel: "+req.body.prompt}]
      })
    });

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content || "No reel";

    res.json({result});

  }catch{
    res.json({error:"Reel failed"});
  }
});

// ===== DASHBOARD =====
app.get("/dashboard", auth, async (req,res)=>{
  const user = await User.findOne({email:req.user.email});
  res.json(user);
});

// ===== START SERVER =====
app.listen(PORT,"0.0.0.0",()=>{
  console.log(`🚀 Server running on port ${PORT}`);
});
