import express from "express";
import {
  uploadVideo,
  getFeed,
  toggleLike,
  addView
} from "../controllers/videoController.js";

const router = express.Router();

/* =========================
   VIDEO ROUTES
========================= */
router.post("/upload", uploadVideo);
router.get("/feed", getFeed);
router.post("/:id/like", toggleLike);
router.post("/:id/view", addView);

export default router;
