const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

router.get("/notifications/:userId", async (req, res) => {
  const notifications = await Notification.find({ receiverId: req.params.userId, isRead: false });
  res.json(notifications);
});

router.post("/notifications/:userId/read", async (req, res) => {
    const userId = req.params.userId;
  
    // Mark notifications as read for the user
    await Notification.updateMany({ receiverId: userId, isRead: false }, { $set: { isRead: true } });
  
    res.status(200).json({ message: "Notifications marked as read" });
  });
  
module.exports = router;
