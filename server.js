import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
  res.send("Backend running 🚀");
});

app.post("/generate", (req, res) => {
  console.log("REQUEST RECEIVED"); // 🔥 DEBUG

  res.json({
    result: "🔥 WORKING BACKEND"
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log("Server running"));
