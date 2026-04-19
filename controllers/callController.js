import Call from "../models/Call.js";

/* =========================
   START CALL
========================= */
export const startCall = async (req, res) => {
  try {
    const { receiverId, callType } = req.body;

    const call = await Call.create({
      callerId: req.user._id,
      receiverId,
      callType: callType || "audio",
      status: "missed"
    });

    res.json({
      success: true,
      call
    });
  } catch (error) {
    res.status(500).json({
      error: "Call start failed"
    });
  }
};

/* =========================
   END CALL
========================= */
export const endCall = async (req, res) => {
  try {
    const { callId, duration, status } = req.body;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        error: "Call not found"
      });
    }

    call.duration = duration || 0;
    call.status = status || "answered";

    await call.save();

    res.json({
      success: true,
      call
    });
  } catch (error) {
    res.status(500).json({
      error: "Call update failed"
    });
  }
};

/* =========================
   GET CALL HISTORY
========================= */
export const getCallHistory = async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [
        { callerId: req.user._id },
        { receiverId: req.user._id }
      ]
    })
      .populate("callerId", "username avatar")
      .populate("receiverId", "username avatar")
      .sort({ createdAt: -1 });

    res.json(calls);
  } catch (error) {
    res.status(500).json({
      error: "Could not load calls"
    });
  }
};
