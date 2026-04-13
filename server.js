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
  req.requestId = "rm_" + Date.now() + Math.floor(Math.random()*1000);
  next();
});

// ===== GLOBAL RESPONSE =====
function success(res, req, type, data={}, extra={}) {
  return res.json({
    status: "success",
    type,
    data,
    meta: {
      request_id: req.requestId,
      time: (Date.now() - req.startTime)/1000,
      ...extra
    }
  });
}

function fail(res, req, message="Error", code=500) {
  return res.status(code).json({
    status: "error",
    message,
    code,
    meta: { request_id: req.requestId }
  });
}

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log("❌ DB Error:", err.message));

// ===== MODELS =====
const User = mongoose.model("User", new mongoose.Schema({
  email: { type:String, unique:true },
  credits: { type:Number, default:100 },
  premium: { type:Boolean, default:false },
  earnings: { type:Number, default:0 }
}));

// ===== AUTH =====
function auth(req,res,next){
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return fail(res, req, "No token", 401);

  try{
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  }catch{
    return fail(res, req, "Invalid token", 401);
  }
}

// ===== ROOT =====
app.get("/", (req,res)=>{
  res.send("🚀 ReelMind AI Backend LIVE");
});

// ===== LOGIN =====
app.post("/login", async (req,res)=>{
  const { email } = req.body;
  if(!email) return fail(res, req, "Email required", 400);

  let user = await User.findOne({ email });
  if(!user) user = await User.create({ email });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn:"7d" });

  return success(res, req, "auth", { token, user });
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
      body:JSON.stringify({
        model:"openai/gpt-3.5-turbo",
        messages:[{
          role:"user",
          content:"Answer clearly and accurately:\n"+req.body.prompt
        }]
      })
    });

    const data = await response.json();

    return success(res, req, "text", {
      content: data?.choices?.[0]?.message?.content || "No response"
    },{
      model:"gpt-3.5"
    });

  }catch{
    return fail(res, req, "AI failed");
  }
});

// ===== IMAGE (FIXED) =====
app.post("/generate-image", auth, async (req,res)=>{
  try{
    const prompt = req.body.prompt + ", ultra realistic, 4k, cinematic";

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Math.random()}`;

    return success(res, req, "image", { url });

  }catch{
    return fail(res, req, "Image failed");
  }
});

// ===== VIDEO =====
app.post("/generate-video", auth, async (req,res)=>{
  try{
    return success(res, req, "video", {
      url:"https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
    });
  }catch{
    return fail(res, req, "Video failed");
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
      body:JSON.stringify({
        model:"openai/gpt-3.5-turbo",
        messages:[{
          role:"user",
          content:"Create viral reel:\n"+req.body.prompt
        }]
      })
    });

    const data = await response.json();

    return success(res, req, "reel", {
      content: data?.choices?.[0]?.message?.content
    });

  }catch{
    return fail(res, req, "Reel failed");
  }
});

// ===== DASHBOARD =====
app.get("/dashboard", auth, async (req,res)=>{
  try{
    const user = await User.findOne({ email:req.user.email });

    return success(res, req, "dashboard", {
      email:user.email,
      credits:user.credits,
      premium:user.premium,
      earnings:user.earnings
    });

  }catch{
    return fail(res, req, "Dashboard failed");
  }
});

// ===== KO-FI PAYMENT =====
app.post("/kofi-webhook", async (req,res)=>{
  try{
    const { email, amount } = req.body;

    const user = await User.findOne({ email });

    if(user){
      user.premium = true;
      user.credits += 500;
      user.earnings += amount || 0;
      await user.save();
    }

    return success(res, req, "payment", {
      message:"Premium activated"
    });

  }catch{
    return fail(res, req, "Payment failed");
  }
});

// ===== START SERVER =====
app.listen(PORT, "0.0.0.0", ()=>{
  console.log("🚀 Server running on port "+PORT);
});
