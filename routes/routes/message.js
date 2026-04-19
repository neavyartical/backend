import express from "express";
import {
  sendMessage,
  getMessages,
  markSeen,
  deleteMessage
} from "../controllers/messageController.js";

const router = express.Router();

/* =========================
   MESSAGE ROUTES
========================= */
router.post("/send", sendMessage);
router.get("/:userId", getMessages);
router.post("/seen/:userId", markSeen);
router.delete("/:id", deleteMessage);

export default router;
