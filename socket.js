const Notification = require('./models/Notification');
const Chat = require('./models/Chat'); // Assuming you have a Chat model
const io = require('socket.io')(server, {
  cors: {
    origin: "https://meethub-frontend.onrender.com", // Update with your frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔥 A user connected:", socket.id);

  // User joins their specific room using userId
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`✅ User ${userId} joined their room`);
  });

  // When a message is sent
  socket.on("send_message", async (data) => {
    const { receiverId, senderId, messageContent } = data;
    const timestamp = new Date();

    // Send the message instantly to receiver **before** saving it in the database
    io.to(receiverId).emit("new_message", {
      senderId,
      receiverId,
      messageContent,
      timestamp,
    });

    io.to(senderId).emit("message_sent_confirmation", {
      senderId,
      receiverId,
      messageContent,
      timestamp,
    });

    try {
      // Save the message asynchronously (doesn't block the real-time update)
      await Chat.create({ senderId, receiverId, messageContent, timestamp });

      // Create or update notification for the receiver
      const notification = await Notification.findOneAndUpdate(
        { receiverId },
        { $inc: { messageCount: 1 }, isRead: false },
        { upsert: true, new: true }
      );

      // Emit the new notification to the receiver
      io.to(receiverId).emit("new_notification", {
        senderId,
        messageCount: notification.messageCount,
      });

    } catch (err) {
      console.error("❌ Error while saving message or updating notification:", err);
    }
  });

  // When a user marks notifications as read
  socket.on("mark_notifications_as_read", async (userId) => {
    try {
      await Notification.updateMany(
        { receiverId: userId, isRead: false },
        { $set: { isRead: true } }
      );

      socket.emit("notifications_read", userId);
    } catch (err) {
      console.error("❌ Error marking notifications as read:", err);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});
