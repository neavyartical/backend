import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    // 🔴 Safety check (this prevents your previous crash)
    if (!uri) {
      console.error("❌ MONGO_URI is missing in environment variables");
      process.exit(1);
    }

    // 🔥 Connect to MongoDB
    const conn = await mongoose.connect(uri);

    console.log("✅ MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
