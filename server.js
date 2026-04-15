<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>🚀 ReelMind AI GOD MODE</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
body{margin:0;font-family:Segoe UI;background:#020617;color:white;}
#topbar{position:fixed;top:0;width:100%;background:#111;padding:10px;display:flex;justify-content:space-around;z-index:1000;}
.section{display:none;margin-top:80px;padding:20px;}
.active{display:block;}
#prompt{position:fixed;bottom:90px;width:90%;left:5%;padding:12px;border-radius:25px;border:none;}
#controls{position:fixed;bottom:0;width:100%;height:70px;display:flex;justify-content:center;background:#111;}
.btn{width:60px;height:60px;border-radius:50%;background:#06b6d4;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;}
.card{background:#111;padding:15px;border-radius:12px;margin-top:15px;}
#creditsBox{position:fixed;top:50px;right:10px;background:#111;padding:8px;border-radius:10px;}
</style>
</head>

<body>

<!-- NAV -->
<div id="topbar">
  <div onclick="switchTab('home')">🏠</div>
  <div onclick="switchTab('create')">➕</div>
  <div onclick="switchTab('profile')">👤</div>
  <div onclick="switchTab('admin')">👑</div>
</div>

<!-- CREDITS -->
<div id="creditsBox">💰 Credits: <span id="credits">∞</span></div>

<!-- HOME -->
<div id="home" class="section active">
  <div class="card">
    <h2>⚡ ReelMind AI GOD MODE</h2>
    <p>Unlimited. Fast. Multi-brain AI.</p>
  </div>

  <div class="card">
    <h3>💰 Support</h3>
    <a href="https://ko-fi.com/articalneavy" target="_blank">
      <button>Ko-fi ☕</button>
    </a>
  </div>
</div>

<!-- CREATE -->
<div id="create" class="section">
  <select id="mode">
    <option value="text">Text</option>
    <option value="image">Image</option>
    <option value="video">Video</option>
  </select>

  <div id="result"></div>
</div>

<!-- PROFILE -->
<div id="profile" class="section">
  <h3>User</h3>
  <p id="userEmail">Guest Mode</p>

  <input id="email" placeholder="Email">
  <input id="password" type="password" placeholder="Password">

  <button onclick="emailLogin()">Login</button>
  <button onclick="emailRegister()">Register</button>
  <button onclick="googleLogin()">Google</button>
  <button onclick="logout()">Logout</button>
</div>

<!-- ADMIN -->
<div id="admin" class="section">
  <h2>👑 Admin Panel</h2>
  <button onclick="toggleUnlimited()">Toggle Unlimited</button>
  <button onclick="resetCredits()">Reset Credits</button>
</div>

<input id="prompt" placeholder="Ask anything..." />

<div id="controls">
  <div id="generate" class="btn">⚡</div>
</div>

<script type="module">

// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp({
  apiKey: "YOUR_FIREBASE_KEY",
  authDomain: "reelmind-ai-f07cb.firebaseapp.com"
});

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

// ================= LOGIN SYSTEM =================
window.googleLogin = async ()=> await signInWithPopup(auth, provider);

window.emailLogin = async ()=>{
  const email = emailInput();
  const pass = passInput();
  await signInWithEmailAndPassword(auth,email,pass);
};

window.emailRegister = async ()=>{
  const email = emailInput();
  const pass = passInput();
  await createUserWithEmailAndPassword(auth,email,pass);
};

window.logout = ()=> signOut(auth);

function emailInput(){return document.getElementById("email").value;}
function passInput(){return document.getElementById("password").value;}

onAuthStateChanged(auth,user=>{
  if(user){
    currentUser = user;
    document.getElementById("userEmail").innerText = user.email;
  } else {
    currentUser = null;
    document.getElementById("userEmail").innerText = "Guest Mode";
  }
});

// ================= NAV =================
window.switchTab = (tab)=>{
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(tab).classList.add("active");
};

// ================= GOD MODE =================
let unlimited = true;
let credits = 10;

window.toggleUnlimited = ()=>{
  unlimited = !unlimited;
  document.getElementById("credits").innerText = unlimited ? "∞" : credits;
  alert("Unlimited: "+unlimited);
};

window.resetCredits = ()=>{
  credits = 10;
  if(!unlimited) document.getElementById("credits").innerText = credits;
};

// ================= ANTI ABUSE =================
let last = 0;
let burst = 0;

function allowed(){
  const now = Date.now();

  if(now - last < 2000){
    burst++;
    if(burst > 5){
      alert("⚠️ Slow down");
      return false;
    }
  } else {
    burst = 0;
  }

  last = now;
  return true;
}

// ================= AI ENGINE =================
document.getElementById("generate").onclick = async ()=>{

  const prompt = document.getElementById("prompt").value.trim();
  const mode = document.getElementById("mode").value;
  const result = document.getElementById("result");

  if(!prompt) return;
  if(!allowed()) return;

  if(!unlimited){
    if(credits <= 0){
      alert("No credits 💰");
      return;
    }
    credits--;
    document.getElementById("credits").innerText = credits;
  }

  result.innerHTML = "⚡ Thinking...";

  try{

    // ===== TEXT =====
    if(mode==="text"){
      let res = await fetch("https://openrouter.ai/api/v1/chat/completions",{
        method:"POST",
        headers:{
          "Authorization":"Bearer YOUR_OPENROUTER_API_KEY",
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model:"openai/gpt-4o-mini",
          messages:[
            {role:"system",content:"You are ultra fast, creative, smart AI."},
            {role:"user",content:prompt}
          ]
        })
      });

      let data = await res.json();
      let output = data?.choices?.[0]?.message?.content;

      if(!output){
        output = "✨ "+prompt+" generated.";
      }

      result.innerHTML = `<div class="card">${output}</div>`;
    }

    // ===== IMAGE =====
    if(mode==="image"){
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Date.now()}`;
      result.innerHTML = `<div class="card"><img src="${url}" style="width:100%"></div>`;
    }

    // ===== VIDEO =====
    if(mode==="video"){
      result.innerHTML = `<div class="card">🎬 Video AI (Runway / Pika coming soon)</div>`;
    }

  }catch(e){
    result.innerHTML = `<div class="card">❌ Error</div>`;
  }

};

</script>

</body>
</html>
