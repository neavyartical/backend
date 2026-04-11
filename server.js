import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();

// ✅ MIDDLEWARE
app.use(express.json());

// ✅ CONNECT TO MONGODB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is missing in environment variables");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
    process.exit(1);
  }
};

connectDB();

// ✅ SERVE FRONTEND (VERY IMPORTANT FOR ADSENSE)
app.use(express.static(path.join(process.cwd(), "public")));

// ✅ TEST ROUTE
app.get("/api", (req, res) => {
  res.json({ message: "API working perfectly 🚀" });
});

// ✅ DEFAULT ROUTE (LOAD INDEX.HTML)
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// ✅ PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
