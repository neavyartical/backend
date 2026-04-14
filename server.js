const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ===== DATABASE (TEMP MEMORY) =====
let posts = [];

// ===== LOGIN =====
app.post("/login", (req,res)=>{
res.json({
data:{ token:"demo-token" }
});
});

// ===== USER =====
app.get("/me",(req,res)=>{
res.json({
data:{
email:"neavyartical@gmail.com",
credits:9999,
referrals:5
}
});
});

// ===== FEED =====
app.get("/feed",(req,res)=>{
res.json({ data: posts });
});

// ===== POST =====
app.post("/post",(req,res)=>{
const { content, type } = req.body;

const newPost = {
id: Date.now(),
content,
type,
likes:0
};

posts.unshift(newPost);

// 🔥 REAL-TIME PUSH
io.emit("new_post", newPost);

res.json({ success:true });
});

// ===== LIKE =====
app.post("/like/:id",(req,res)=>{
const post = posts.find(p=>p.id==req.params.id);
if(post) post.likes++;
res.json({ success:true });
});

// ===== START =====
server.listen(3000,()=>{
console.log("🔥 ReelMind Server Running on port 3000");
});
