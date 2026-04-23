const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

/* =========================
   VIDEO MODEL
========================= */
const videoSchema = new mongoose.Schema({
  userId: String,
  username: String,
  avatar: String,
  caption: String,
  mediaUrl: String,
  mediaType: {
    type: String,
    default: "video"
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  comments: [
    {
      userId: String,
      username: String,
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Video =
  mongoose.models.Video ||
  mongoose.model("Video", videoSchema);

/* =========================
   GET FEED
========================= */
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      videos
    });
  } catch {
    res.status(500).json({
      success: false,
      videos: []
    });
  }
});

/* =========================
   CREATE POST
========================= */
router.post("/create", async (req, res) => {
  try {
    const {
      userId,
      username,
      avatar,
      caption,
      mediaUrl,
      mediaType
    } = req.body;

    const video = await Video.create({
      userId,
      username,
      avatar,
      caption,
      mediaUrl,
      mediaType
    });

    res.json({
      success: true,
      video
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to create post"
    });
  }
});

/* =========================
   LIKE POST
========================= */
router.post("/like/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false
      });
    }

    video.likes += 1;
    await video.save();

    res.json({
      success: true,
      likes: video.likes
    });
  } catch {
    res.status(500).json({
      success: false
    });
  }
});

/* =========================
   SHARE POST
========================= */
router.post("/share/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false
      });
    }

    video.shares += 1;
    await video.save();

    res.json({
      success: true,
      shares: video.shares
    });
  } catch {
    res.status(500).json({
      success: false
    });
  }
});

/* =========================
   COMMENT POST
========================= */
router.post("/comment/:id", async (req, res) => {
  try {
    const {
      userId,
      username,
      text
    } = req.body;

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false
      });
    }

    video.comments.push({
      userId,
      username,
      text
    });

    await video.save();

    res.json({
      success: true,
      comments: video.comments
    });
  } catch {
    res.status(500).json({
      success: false
    });
  }
});

/* =========================
   DELETE POST
========================= */
router.delete("/delete/:id", async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true
    });
  } catch {
    res.status(500).json({
      success: false
    });
  }
});

module.exports = router;
