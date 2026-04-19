const Call = require("../models/Call");

/* =========================
   START CALL
========================= */
const startCall = async (req, res) => {
  try {
    const { caller, receiver, type } = req.body;

    const call = await Call.create({
      caller,
      receiver,
      type,
      status: "ongoing"
    });

    res.json({
      success: true,
      call
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to start call"
    });
  }
};

/* =========================
   END CALL
========================= */
const endCall = async (req, res) => {
  try {
    const { callId } = req.body;

    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: "ended",
        endedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      call
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to end call"
    });
  }
};

/* =========================
   CALL HISTORY
========================= */
const getCallHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const calls = await Call.find({
      $or: [
        { caller: userId },
        { receiver: userId }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      calls
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to load calls"
    });
  }
};

module.exports = {
  startCall,
  endCall,
  getCallHistory
};
