const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages
} = require("../controllers/messageController");

router.post("/send", sendMessage);
router.get("/:userId/:targetId", getMessages);

module.exports = router;

