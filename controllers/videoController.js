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

    if (!userId || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    const video = await Video.create({
      user: userId,
      caption: caption || "",
      videoUrl,
      thumbnail: thumbnail || "",
      location: location || ""
    });

    res.json({
      success: true,
      message: "Video uploaded successfully",
      video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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
      count: videos.length,
      videos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to load videos"
    });
  }
};

/* =========================
   LIKE / UNLIKE VIDEO
========================= */
const likeVideo = async (req, res) => {
  try {
    const { userId } = req.body;

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: "Video not found"
      });
    }

    const alreadyLiked = video.likes.includes(userId);

    if (alreadyLiked) {
      video.likes.pull(userId);
    } else {
      video.likes.push(userId);
    }

    await video.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likes: video.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Like failed"
    });
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  likeVideo
};
