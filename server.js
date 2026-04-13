require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret";

// ===== DATABASE =====
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log("❌ DB Error:", err.message));

// ===== MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  email:{type:String,unique:true},
  credits:{type:Number,default:100},
  referrals:{type:Number,default:0},
  premium:{type:Boolean,default:false}
}));

// ===== HELPERS =====
const success=(res,data)=>res.json({status:"success",data});
const fail=(res,msg="Error",code=500)=>res.status(code).json({status:"error",message:msg});

// ===== AUTH =====
function auth(req,res,next){
  const token=req.headers.authorization?.split(" ")[1];
  if(!token) return fail(res,"No token",401);
  try{
    req.user=jwt.verify(token,JWT_SECRET);
    next();
  }catch{
    return fail(res,"Invalid token",401);
  }
}

// ===== ROOT =====
app.get("/",(req,res)=>res.send("🚀 ReelMind Backend Live"));

// ===== LOGIN =====
app.post("/login",async(req,res)=>{
  const {email}=req.body;
  if(!email) return fail(res,"Email required",400);

  let user=await User.findOne({email});
  if(!user) user=await User.create({email});

  const token=jwt.sign({email},JWT_SECRET,{expiresIn:"7d"});

  return success(res,{
    token,
    email:user.email,
    credits:user.credits,
    referrals:user.referrals
  });
});

// ===== USER =====
app.get("/me",auth,async(req,res)=>{
  const user=await User.findOne({email:req.user.email});
  success(res,user);
});

// ===== TEXT (LONG STORY FIX) =====
app.post("/generate-text",auth,async(req,res)=>{
  try{
    const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+process.env.OPENROUTER_API_KEY,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"openai/gpt-4o-mini",
        max_tokens:2000,
        messages:[{role:"user",content:req.body.prompt}]
      })
    });

    const data=await response.json();

    success(res,{
      content:data?.choices?.[0]?.message?.content || "No response"
    });

  }catch{
    fail(res,"AI failed");
  }
});

// ===== IMAGE (HIGH QUALITY) =====
app.post("/generate-image",auth,(req,res)=>{
  const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt+" cinematic 8k ultra realistic")}`;
  success(res,{url});
});

// ===== VIDEO (READY FOR RUNWAY) =====
app.post("/generate-video",auth,(req,res)=>{
  success(res,{
    url:"https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
  });
});

// ===== REFERRALS =====
app.post("/referral",auth,async(req,res)=>{
  const {code}=req.body;
  const refUser=await User.findOne({email:code});
  if(!refUser) return fail(res,"Invalid referral");

  await User.updateOne({email:refUser.email},{
    $inc:{referrals:1,credits:20}
  });

  success(res,{message:"Referral added"});
});

// ===== ADD CREDITS (KO-FI) =====
app.post("/add-credits",async(req,res)=>{
  const {email,amount}=req.body;

  await User.updateOne({email},{
    $inc:{credits:amount}
  });

  success(res,{message:"Credits added"});
});

// ===== START =====
app.listen(PORT,"0.0.0.0",()=>{
  console.log("🚀 Server running on "+PORT);
});
