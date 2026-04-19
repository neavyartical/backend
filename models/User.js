
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: String,
  credits: { type: Number, default: 10 },
  isOwner: { type: Boolean, default: false },
  subscription: { type: String, default: "free" }
});

export default mongoose.model("User", userSchema);
