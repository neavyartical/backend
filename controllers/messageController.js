import Message from "../models/Message.js";

/* =========================
   SEND MESSAGE
========================= */
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, voiceUrl, imageUrl } = req.body;

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      text,
      voiceUrl,
      imageUrl
    });

    res.json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      error: "Message failed"
    });
  }
};

/* =========================
   GET CHAT
========================= */
export const getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        {
          senderId: req.user._id,
          receiverId: otherUserId
        },
        {
          senderId: otherUserId,
          receiverId: req.user._id
        }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      error: "Could not load messages"
    });
  }
};

/* =========================
   MARK SEEN
========================= */
export const markSeen = async (req, res) => {
  try {
    await Message.updateMany(
      {
        senderId: req.params.userId,
        receiverId: req.user._id,
        seen: false
      },
      {
        seen: true
      }
    );

    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update seen"
    });
  }
};

/* =========================
   DELETE MESSAGE
========================= */
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        error: "Message not found"
      });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Not allowed"
      });
    }

    message.deleted = true;
    await message.save();

    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: "Delete failed"
    });
  }
};
