import Video from "../models/Video.js";

/* =========================
   UPLOAD VIDEO
========================= */
export const uploadVideo = async (req, res) => {
  try {
    const { caption, videoUrl, thumbnail, duration } = req.body;

    const video = await Video.create({
      userId: req.user._id,
      caption,
      videoUrl,
      thumbnail,
      duration
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
   GET FEED
========================= */
export const getFeed = async (req, res) => {
  try {
    const videos = await Video.find({ visibility: "public" })
      .populate("userId", "username avatar")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(videos);
  } catch (error) {
    res.status(500).json({
      error: "Could not load feed"
    });
  }
};

/* =========================
   LIKE / UNLIKE VIDEO
========================= */
export const toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found"
      });
    }

    const alreadyLiked = video.likes.includes(req.user._id);

    if (alreadyLiked) {
      video.likes = video.likes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      video.likes.push(req.user._id);
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

/* =========================
   ADD VIEW
========================= */
export const addView = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found"
      });
    }

    video.views += 1;
    await video.save();

    res.json({
      success: true,
      views: video.views
    });
  } catch (error) {
    res.status(500).json({
      error: "View update failed"
    });
  }
};
