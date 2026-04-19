
const express = require("express");
const router = express.Router();

const {
  startCall,
  endCall,
  getCallHistory
} = require("../controllers/callController");

router.post("/start", startCall);
router.post("/end", endCall);
router.get("/:userId", getCallHistory);

module.exports = router;
