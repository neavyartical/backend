const Call = require("../models/Call");

/* =========================
   START CALL
========================= */
const startCall = async (req, res) => {
  try {
    const {
      caller,
      receiver,
      type
    } = req.body;

    const call = await Call.create({
      caller,
      receiver,
      type: type || "audio",
      status: "ringing",
      startedAt: new Date()
    });

    res.json({
      success: true,
      call
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to start call"
    });
  }
};

/* =========================
   ANSWER CALL
========================= */
const answerCall = async (req, res) => {
  try {
    const { callId } = req.body;

    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: "answered"
      },
      { new: true }
    );

    res.json({
      success: true,
      call
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to answer call"
    });
  }
};

/* =========================
   END CALL
========================= */
const endCall = async (req, res) => {
  try {
    const { callId } = req.body;

    const existingCall = await Call.findById(callId);

    if (!existingCall) {
      return res.status(404).json({
        success: false,
        error: "Call not found"
      });
    }

    const endedAt = new Date();

    const duration =
      existingCall.startedAt
        ? Math.floor((endedAt - existingCall.startedAt) / 1000)
        : 0;

    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status:
          existingCall.status === "ringing"
            ? "missed"
            : "ended",
        endedAt,
        duration
      },
      { new: true }
    );

    res.json({
      success: true,
      call
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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
      success: false,
      error: "Failed to load calls"
    });
  }
};

module.exports = {
  startCall,
  answerCall,
  endCall,
  getCallHistory
};
