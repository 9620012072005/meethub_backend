const Notification = require('./models/Notification');
const io = require('socket.io')(server);

io.on("connection", (socket) => {
  console.log("A user connected");

  // User joins a specific room (their userId) to receive messages and notifications
  socket.on('join', (userId) => {
    socket.join(userId); // Join the socket to the user's specific room
    console.log(`User ${userId} joined their room`);
  });

  // When a message is sent
  socket.on("send_message", async (data) => {
    const { receiverId, senderId, messageContent } = data;

    try {
      // Save the message to your chat model here
      // Example: await Chat.create({ senderId, receiverId, messageContent });

      // Create or update notification for the receiver
      const notification = await Notification.findOneAndUpdate(
        { receiverId },
        { $inc: { messageCount: 1 }, isRead: false },
        { upsert: true, new: true }
      );

      // Emit the message to the receiver
      io.to(receiverId).emit("new_message", {
        senderId,
        receiverId,
        messageContent,
      });

      // Emit the new notification to the receiver
      io.to(receiverId).emit("new_notification", {
        senderId,
        messageCount: notification.messageCount,
      });

      // Optionally emit a confirmation to the sender
      io.to(senderId).emit("message_sent_confirmation", {
        senderId,
        receiverId,
        messageContent,
      });

    } catch (err) {
      console.error("Error while sending message or updating notification:", err);
    }
  });

  // When a user marks notifications as read
  socket.on("mark_notifications_as_read", async (userId) => {
    try {
      // Mark all unread notifications as read for the user
      await Notification.updateMany({ receiverId: userId, isRead: false }, { $set: { isRead: true } });
      
      // Emit a confirmation that notifications have been read
      socket.emit("notifications_read", userId);

    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  });

  // Disconnect the socket when the user disconnects
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
