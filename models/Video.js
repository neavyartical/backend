import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    caption: {
      type: String,
      default: ""
    },

    videoUrl: {
      type: String,
      required: true
    },

    thumbnail: {
      type: String,
      default: ""
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    commentsCount: {
      type: Number,
      default: 0
    },

    shares: {
      type: Number,
      default: 0
    },

    views: {
      type: Number,
      default: 0
    },

    duration: {
      type: Number,
      default: 0
    },

    visibility: {
      type: String,
      default: "public"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Video || mongoose.model("Video", videoSchema);
