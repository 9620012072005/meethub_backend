const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  messageCount: { type: Number, default: 1 },
  isRead: { type: Boolean, default: false },
});

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
