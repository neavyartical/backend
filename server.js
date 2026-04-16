require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
const mongoose = require("mongoose");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ================= FIREBASE ADMIN =================
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});

// ================= MONGODB =================
mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  credits: { type: Number, default: 20 }
});

const User = mongoose.model("User", userSchema);

// ================= AUTH =================
async function auth(req, res, next){
  try{
    const bearer = req.headers.authorization;
    if(!bearer) return next();

    const token = bearer.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  }catch{
    next();
  }
}

app.use(auth);

// ================= USER =================
app.get("/me", async (req,res)=>{
  if(!req.user){
    return res.json({ guest:true, credits:"∞" });
  }

  let user = await User.findOne({ uid:req.user.uid });

  if(!user){
    user = await User.create({
      uid:req.user.uid,
      email:req.user.email,
      credits:20
    });
  }

  res.json(user);
});

// ================= TEXT =================
app.post("/generate-text", async (req,res)=>{
  try{
    const { prompt, language } = req.body;

    const reply = await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"openai/gpt-4o-mini",
        messages:[
          {
            role:"system",
            content:`Respond fluently in ${language || "English"}.
Generate detailed unlimited responses.
Understand any world language including Krio, Temne, Limba and Mende.`
          },
          {
            role:"user",
            content:prompt
          }
        ]
      })
    });

    const data = await reply.json();

    if(req.user){
      await User.updateOne(
        { uid:req.user.uid },
        { $inc:{ credits:-1 } }
      );
    }

    res.json({
      data:{
        content:data?.choices?.[0]?.message?.content || "No response"
      }
    });

  }catch(err){
    res.status(500).json({ error:"TEXT_FAILED" });
  }
});

// ================= IMAGE =================
app.post("/generate-image", async (req,res)=>{
  const { prompt } = req.body;

  res.json({
    data:{
      url:`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Date.now()}`
    }
  });
});

// ================= VIDEO =================
app.post("/generate-video", async (req,res)=>{
  res.json({
    preview:"https://www.w3schools.com/html/mov_bbb.mp4"
  });
});

// ================= ADMIN =================
app.get("/admin", async (req,res)=>{
  const users = await User.countDocuments();
  res.json({
    users,
    requests:"Live"
  });
});

// ================= KO-FI =================
app.post("/kofi-webhook", async (req,res)=>{
  const { email } = req.body;

  await User.updateOne(
    { email },
    { $inc:{ credits:50 } }
  );

  res.send("OK");
});

// ================= ROOT =================
app.get("/", (req,res)=>{
  res.send("ReelMind backend live");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log("Server running on " + PORT));
