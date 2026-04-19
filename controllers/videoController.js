const Video = require("../models/Video");
const User = require("../models/User");

/* =========================
   UPLOAD VIDEO
========================= */
const uploadVideo = async (req, res) => {
  try {
    const {
      userId,
      caption,
      videoUrl,
      thumbnail,
      location
    } = req.body;

    const video = await Video.create({
      user: userId,
      caption,
      videoUrl,
      thumbnail,
      location
    });

    res.json({
      success: true,
      video
    });
  } catch (error) {
    res.status(500).json({
      error: "Video upload failed"
    });
  }
};

/* =========================
   GET VIDEOS
========================= */
const getVideos = async (req, res) => {
  try {
    const videos = await Video.find()
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      videos
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to load videos"
    });
  }
};

/* =========================
   LIKE VIDEO
========================= */
const likeVideo = async (req, res) => {
  try {
    const { userId } = req.body;
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found"
      });
    }

    const liked = video.likes.includes(userId);

    if (liked) {
      video.likes.pull(userId);
    } else {
      video.likes.push(userId);
    }

    await video.save();

    res.json({
      success: true,
      likes: video.likes.length
    });
  } catch (error) {
    res.status(500).json({
      error: "Like failed"
    });
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  likeVideo
};
