const express = require("express");
const router = express.Router();

const {
  startCall,
  answerCall,
  endCall,
  getCallHistory
} = require("../controllers/callController");

/* =========================
   CALL ROUTES
========================= */
router.post("/start", startCall);
router.post("/answer", answerCall);
router.post("/end", endCall);
router.get("/:userId", getCallHistory);

module.exports = router;
