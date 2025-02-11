const Chat = require("../models/Chat");
const User = require("../models/User");

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id; // Extracted from JWT token

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Receiver ID and content are required" });
    }

    const message = new Chat({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    await message.save();

    const populatedMessage = await message.populate("sender", "name avatar");

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get chat messages between two users with sender details
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Chat.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 }) // Sort messages in chronological order
      .populate("sender", "name avatar");

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
