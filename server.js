<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ReelMind AI - Powered by Artical Neavy</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- ADSENSE -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1714638410489429" crossorigin="anonymous"></script>

<style>
body{margin:0;background:#0b0f14;color:white;font-family:Arial}

/* DASHBOARD */
#topbar{
position:fixed;top:0;width:100%;
background:#111;padding:10px;
display:flex;justify-content:space-around;
font-size:12px;z-index:999;
}
#topbar span{color:#00ff88}

/* LINKS */
#links{
position:fixed;top:40px;width:100%;
text-align:center;font-size:11px;
}
#links a{color:#00ff88;margin:5px;text-decoration:none}

/* CHAT */
#chat{
position:absolute;top:70px;bottom:150px;
width:100%;overflow:auto;padding:10px;
}

.msg{margin:10px;padding:12px;border-radius:12px;max-width:80%}
.user{background:#1f1f1f;margin-left:auto}
.ai{background:#16212b}

img,video{width:100%;border-radius:10px}

/* CAPTION */
.caption{
font-size:12px;color:#aaa;margin-top:5px;
}

/* GENERATE BUTTON */
#generateBtn{
position:absolute;
top:50%;
left:50%;
transform:translate(-50%,-50%);
width:130px;height:130px;
border-radius:50%;
background:cyan;
color:black;
font-weight:bold;
display:flex;
align-items:center;
justify-content:center;
box-shadow:0 0 50px cyan;
cursor:pointer;
}

/* FLOAT BUTTONS */
#uploadBtn,#micBtn{
position:fixed;
bottom:140px;
width:55px;height:55px;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
font-size:22px;
z-index:999;
}
#uploadBtn{left:15px;background:#00ff88}
#micBtn{right:15px;background:#00ccff}

/* INPUT */
#inputArea{
position:fixed;bottom:0;width:100%;
display:flex;padding:10px;background:#111
}
input{flex:1;padding:12px;border-radius:25px;border:none}
</style>
</head>

<body>

<!-- DASHBOARD -->
<div id="topbar">
<span id="status">🔴 Offline</span>
<span id="user">User: Guest</span>
<span id="credits">Credits: 100</span>
<span id="ref">Ref: 0</span>
<span onclick="upgrade()">💰 Upgrade</span>
</div>

<!-- LINKS -->
<div id="links">
<a href="#">About</a>
<a href="#">Privacy</a>
<a href="#">Terms</a>
<a href="#">Blog</a>
<a href="#">Contact</a>
</div>

<div id="chat"></div>

<!-- GENERATE -->
<div id="generateBtn" onclick="generate()">GENERATE</div>

<!-- FLOAT BUTTONS -->
<div id="uploadBtn" onclick="fileInput.click()">+</div>
<input type="file" id="fileInput" hidden onchange="uploadFile(event)">
<div id="micBtn" onclick="startVoice()">🎤</div>

<!-- ADS -->
<div style="position:fixed;bottom:90px;width:100%;text-align:center;">
<ins class="adsbygoogle"
style="display:block"
data-ad-client="ca-pub-1714638410489429"
data-ad-slot="1234567890"
data-ad-format="auto"></ins>
</div>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>

<!-- INPUT -->
<div id="inputArea">
<input id="prompt" placeholder="Ask anything..." />
</div>

<script>
const API="https://reelmindbackend-1.onrender.com";
const chat=document.getElementById("chat");
let lastOutput="";

// ===== LOGIN =====
async function ensureLogin(){
if(!localStorage.token){
try{
let r=await fetch(API+"/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email:"guest@user.com"})
});
let d=await r.json();

let token = d.token || d.data?.token || d.access_token;

if(token){
localStorage.token=token;
document.getElementById("status").innerText="🟢 Online";
}
}catch{
document.getElementById("status").innerText="❌ Offline";
}
}
}

// ===== ADD MESSAGE =====
function addMsg(text,type){
let d=document.createElement("div");
d.className="msg "+type;
d.innerText=text;
chat.appendChild(d);
chat.scrollTop=chat.scrollHeight;
return d;
}

// ===== CAPTION GENERATOR =====
function generateCaption(text){
return "✨ AI Result: " + text.substring(0,60) + "...";
}

// ===== GENERATE =====
async function generate(){
await ensureLogin();

let p=document.getElementById("prompt").value.trim();
if(!p) return;

addMsg(p,"user");
let box=addMsg("⚡ Generating fast...","ai");

// ROUTING
let route="/generate-text";
if(/image|picture|photo|art/i.test(p)) route="/generate-image";
else if(/video|movie|clip/i.test(p)) route="/generate-video";
else if(/reel|tiktok|short/i.test(p)) route="/generate-reel";

// PROMPT BOOST
let finalPrompt=p;

if(route==="/generate-text"){
finalPrompt=`Write a HIGH QUALITY, LONG (400+ words), engaging response:\n${p}`;
}

if(route==="/generate-image"){
finalPrompt=p+", ultra realistic, cinematic lighting, 8k, masterpiece";
}

// FAST FETCH
try{
let r=await fetch(API+route,{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+localStorage.token
},
body:JSON.stringify({prompt:finalPrompt})
});

let d=await r.json();

// TOKEN FIX
if(d.error==="Invalid token" || d.message==="Invalid token"){
localStorage.removeItem("token");
return generate();
}

// OUTPUT
if(route==="/generate-image"){
let url=d.image || d.data?.url;
lastOutput=url;

box.innerHTML=`
<img src="${url}">
<div class="caption">${generateCaption(p)}</div>
`;
}
else if(route==="/generate-video"){
let url=d.video || d.data?.url;
lastOutput=url;

box.innerHTML=`
<video controls src="${url}"></video>
<div class="caption">${generateCaption(p)}</div>
`;
}
else{
let text=d.result || d.data?.content;
lastOutput=text;

box.innerHTML=`
<div>${text}</div>
<div class="caption">${generateCaption(text)}</div>
`;
}

}catch{
box.innerText="⚠️ Server slow — tap GENERATE again";
}
}

// ===== UPLOAD =====
function uploadFile(e){
addMsg("📁 "+e.target.files[0].name,"user");
}

// ===== VOICE =====
function startVoice(){
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if(!SpeechRecognition){
alert("🎤 Not supported");
return;
}

let rec=new SpeechRecognition();
rec.lang="en-US";
rec.onresult=e=>{
document.getElementById("prompt").value=e.results[0][0].transcript;
};
rec.start();
}

// ===== PAYMENT =====
function upgrade(){
window.open("https://ko-fi.com/articalneavy","_blank");
}
</script>

</body>
</html>
