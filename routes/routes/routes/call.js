const express = require("express");
const {
  startCall,
  endCall,
  getCallHistory
} = require("../controllers/callController");

const router = express.Router();

/* =========================
   CALL ROUTES
========================= */
router.post("/start", startCall);
router.post("/end", endCall);
router.get("/history", getCallHistory);

module.exports = router;
