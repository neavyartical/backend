import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔗 CONNECT DB
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

// 👤 USER MODEL
const UserSchema = new mongoose.Schema({
  username:String,
  password:String,
  premium:{type:Boolean, default:false},
  usage:{type:Number, default:0},
  lastReset:{type:Number, default:Date.now}
});

const User = mongoose.model("User",UserSchema);

// 🔄 DAILY RESET FUNCTION
function resetUsage(user){
  let now = Date.now();
  if(now - user.lastReset > 86400000){
    user.usage = 0;
    user.lastReset = now;
  }
}

// 🟢 REGISTER
app.post("/register", async (req,res)=>{
  const {username,password} = req.body;

  let existing = await User.findOne({username});
  if(existing){
    return res.json({success:false,message:"User exists"});
  }

  const hashed = await bcrypt.hash(password,10);

  await User.create({
    username,
    password:hashed
  });

  res.json({success:true});
});

// 🔵 LOGIN
app.post("/login", async (req,res)=>{
  const {username,password} = req.body;

  let user = await User.findOne({username});

  if(user && await bcrypt.compare(password,user.password)){
    return res.json({
      success:true,
      premium:user.premium
    });
  }

  res.json({success:false});
});

// 💳 STRIPE CHECKOUT
app.post("/create-checkout", async (req,res)=>{
  const session = await stripe.checkout.sessions.create({
    payment_method_types:["card"],
    mode:"subscription",
    line_items:[{
      price:"price_XXXX", // 🔥 REPLACE WITH YOUR STRIPE PRICE ID
      quantity:1
    }],
    success_url:`${process.env.DOMAIN}?success=true`,
    cancel_url:`${process.env.DOMAIN}?cancel=true`
  });

  res.json({url:session.url});
});

// 💰 VERIFY PAYMENT (AFTER SUCCESS)
app.post("/verify", async (req,res)=>{
  const {username} = req.body;

  let user = await User.findOne({username});
  if(user){
    user.premium = true;
    await user.save();
    return res.json({success:true});
  }

  res.json({success:false});
});

// 🤖 GENERATE
app.post("/generate", async (req,res)=>{
  const {prompt,type,username} = req.body;

  if(!prompt) return res.json({result:"Enter prompt"});

  let user = await User.findOne({username});
  if(!user) return res.json({result:"Login first"});

  resetUsage(user);

  // 🚫 FREE LIMIT
  if(!user.premium && user.usage >= 3){
    return res.json({
      result:"🚫 Free limit reached. Upgrade to Premium"
    });
  }

  try{

    // 🧠 TEXT AI (PREMIUM ONLY)
    if(type==="chat" || type==="story"){
      if(user.premium){

        const response = await fetch("https://api.openai.com/v1/chat/completions",{
          method:"POST",
          headers:{
            "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            model:"gpt-4o-mini",
            messages:[{role:"user",content:prompt}],
            max_tokens:100
          })
        });

        const data = await response.json();

        user.usage++;
        await user.save();

        return res.json({
          result:data.choices?.[0]?.message?.content || "Error"
        });

      }else{
        user.usage++;
        await user.save();

        return res.json({
          result:"🔥 Free AI: " + prompt
        });
      }
    }

    // 🖼 IMAGE (FREE)
    if(type==="image"){
      user.usage++;
      await user.save();

      return res.json({
        result:`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      });
    }

    // 🎬 VIDEO (TEMP)
    if(type==="video"){
      user.usage++;
      await user.save();

      return res.json({
        result:`https://pollinations.ai/video?prompt=${encodeURIComponent(prompt)}`
      });
    }

    res.json({result:"Invalid type"});

  }catch(err){
    console.log(err);
    res.json({result:"Server error"});
  }
});

// 🚀 START SERVER
app.listen(process.env.PORT,()=>{
  console.log("Server running");
});
