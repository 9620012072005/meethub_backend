const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User"); // Import the User model

// Function to get the correct avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return "/default-avatar.png"; // Default avatar

  return avatarPath.startsWith("http") ? avatarPath : `http://localhost:5000${avatarPath}`;
};

// 📩 Controller to Send a Message
const sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user._id;

    console.log("Received message request:", { sender, receiver, content });

    if (!receiver || !content) {
      console.log("Missing receiver ID or content");
      return res.status(400).json({ message: "Receiver ID and content are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      console.log("Invalid receiver ID:", receiver);
      return res.status(400).json({ message: "Invalid receiver ID" });
    }

    // Create and save the message
    const message = await Message.create({ sender, receiver, content });

    console.log("Message saved successfully:", message);

    res.status(201).json({
      message: "Message sent successfully",
      messageData: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
socket.on("send_message", (data) => {
  io.to(data.roomId).emit("send_message", data);  // Send message to the specific room
});

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;

    console.log("Fetching messages between:", { currentUser, userId });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid user ID:", userId);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch messages with sender and receiver details
    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: userId },
        { sender: userId, receiver: currentUser },
      ],
    })
      .sort({ createdAt: 1 }) // Sort by message creation time
      .populate({
        path: "sender",
        select: "name avatar",
        model: User,
      })
      .populate({
        path: "receiver",
        select: "name avatar",
        model: User,
      })
      .lean(); // Improves performance

    if (!messages.length) {
      console.log("No messages found between users");
    } else {
      console.log("Messages fetched successfully:", messages);
    }

    // Format messages with proper avatar URLs
    const formattedMessages = messages.map((msg) => ({
      ...msg,
      senderAvatarUrl: getAvatarUrl(msg.sender?.avatar || ""),
      receiverAvatarUrl: getAvatarUrl(msg.receiver?.avatar || ""),
    }));

    res.status(200).json({ messages: formattedMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Socket.io event to send a message to the right room (receiver)
const socketHandler = (io, socket) => {
  socket.on("send_message", (data) => {
    console.log("Socket received message:", data);
    io.to(data.roomId).emit("send_message", data);  // Send message to the specific room
  });
};


module.exports = { sendMessage, getMessages };
