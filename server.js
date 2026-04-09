import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/", (req,res)=>{
  res.send("Backend running 🚀");
});

// 🔥 FORCE RESPONSE (NO API, NO WAIT)
app.post("/generate", (req, res) => {
  const { type, prompt } = req.body;

  res.json({
    result: "✅ WORKING: " + type + " → " + prompt
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log("Server running"));
