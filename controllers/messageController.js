const Message = require("../models/Message");

/* =========================
   SEND MESSAGE
========================= */
const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    if (!sender || !receiver || !text) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    const message = await Message.create({
      sender,
      receiver,
      text
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

module.exports = {
  sendMessage,
  getMessages
};
