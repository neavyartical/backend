import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      sparse: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    username: {
      type: String,
      default: ""
    },

    avatar: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: ""
    },

    credits: {
      type: Number,
      default: 10
    },

    isOwner: {
      type: Boolean,
      default: false
    },

    subscription: {
      type: String,
      default: "free"
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    likesReceived: {
      type: Number,
      default: 0
    },

    online: {
      type: Boolean,
      default: false
    },

    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
