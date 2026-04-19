import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    callType: {
      type: String,
      enum: ["audio", "video"],
      default: "audio"
    },

    status: {
      type: String,
      enum: ["missed", "answered", "rejected"],
      default: "missed"
    },

    duration: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Call || mongoose.model("Call", callSchema);
