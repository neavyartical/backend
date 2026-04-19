const Message = require("../models/Message");

/* =========================
   SEND MESSAGE
========================= */
const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    const message = await Message.create({
      sender,
      receiver,
      text
    });

    res.json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send message"
    });
  }
};

/* =========================
   GET MESSAGES
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
      messages
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to load messages"
    });
  }
};

module.exports = {
  sendMessage,
  getMessages
};
