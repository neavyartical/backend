const Message = require("../models/Message");

/* =========================
   SEND MESSAGE
========================= */
const sendMessage = async (req, res) => {
  try {
    const {
      sender,
      receiver,
      text,
      messageType
    } = req.body;

    if (!sender || !receiver || !text) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    const message = await Message.create({
      sender,
      receiver,
      text,
      messageType: messageType || "text",
      seen: false
    });

    res.json({
      success: true,
      message: "Message sent successfully",
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to send message"
    });
  }
};

/* =========================
   GET CONVERSATION
========================= */
const getMessages = async (req, res) => {
  try {
    const { userId, targetId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: targetId },
        { sender: targetId, receiver: userId }
      ]
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to load messages"
    });
  }
};

/* =========================
   MARK AS SEEN
========================= */
const markSeen = async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    await Message.updateMany(
      {
        sender,
        receiver,
        seen: false
      },
      {
        seen: true
      }
    );

    res.json({
      success: true
    });
  } catch {
    res.status(500).json({
      success: false
    });
  }
};

/* =========================
   DELETE MESSAGE
========================= */
const deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);

    res.json({
      success: true
    });
  } catch {
    res.status(500).json({
      success: false
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markSeen,
  deleteMessage
};
