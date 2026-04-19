const express = require("express");
const router = express.Router();

const {
  uploadVideo,
  getVideos,
  likeVideo
} = require("../controllers/videoController");

router.post("/upload", uploadVideo);
router.get("/", getVideos);
router.post("/:id/like", likeVideo);

module.exports = router;
