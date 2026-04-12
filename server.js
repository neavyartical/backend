// IMPORTS
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET);

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(cors());

// ENV
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

// DB
mongoose.connect(MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch(err => console.log(err));

// MODELS
const User = mongoose.model("User", {
  email: String,
  password: String,
  plan: { type: String, default: "free" }
});

const Project = mongoose.model("Project", {
  userId: String,
  content: String,
  type: String,
  createdAt: { type: Date, default: Date.now }
});

// AUTH
app.post("/register", async (req,res)=>{
  const {email,password}=req.body;
  const hashed=await bcrypt.hash(password,10);
  await new User({email,password:hashed}).save();
  res.json({msg:"Registered"});
});

app.post("/login", async (req,res)=>{
  const {email,password}=req.body;
  const user=await User.findOne({email});
  if(!user) return res.json({msg:"No user"});
  const valid=await bcrypt.compare(password,user.password);
  if(!valid) return res.json({msg:"Wrong pass"});
  const token=jwt.sign({id:user._id},JWT_SECRET);
  res.json({token});
});

// AI TEXT
app.post("/generate", async (req,res)=>{
  const {prompt}=req.body;
  if(!prompt) return res.json({result:"Enter something"});

  try{
    const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        Authorization:`Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"openai/gpt-4o-mini",
        messages:[{role:"user",content:prompt}]
      })
    });

    const d=await r.json();
    res.json({result:d.choices?.[0]?.message?.content});
  }catch{
    res.json({result:"AI error"});
  }
});

// IMAGE
app.post("/image", async (req,res)=>{
  const {prompt}=req.body;

  const r=await fetch(
    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
    {
      method:"POST",
      headers:{Authorization:`Bearer ${HF_API_KEY}`},
      body:JSON.stringify({inputs:prompt})
    }
  );

  const buffer=await r.arrayBuffer();
  const base64=Buffer.from(buffer).toString("base64");

  res.json({image:`data:image/png;base64,${base64}`});
});

// VIDEO EDIT
app.post("/video-edit", async (req,res)=>{
  res.json({edit:"AI edited video"});
});

// STRIPE
app.post("/pay", async (req,res)=>{
  const session=await stripe.checkout.sessions.create({
    payment_method_types:["card"],
    line_items:[{
      price_data:{
        currency:"usd",
        product_data:{name:"ReelMind Premium"},
        unit_amount:500
      },
      quantity:1
    }],
    mode:"payment",
    success_url:"https://your-site.com/success",
    cancel_url:"https://your-site.com/cancel"
  });

  res.json({url:session.url});
});

// ADSENSE VERIFY
app.get("/ads.txt",(req,res)=>{
  res.send("google.com, pub-1714638410489429, DIRECT, f08c47fec0942fa0");
});

// PAGES
app.get("/privacy",(req,res)=>res.send("Privacy Policy"));
app.get("/about",(req,res)=>res.send("About ReelMind AI"));
app.get("/contact",(req,res)=>res.send("Contact us"));
app.get("/blog",(req,res)=>res.send("AI blog content"));

app.get("/",(req,res)=>res.send("Backend running"));

app.listen(10000,()=>console.log("Server running"));
