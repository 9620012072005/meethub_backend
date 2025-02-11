const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController"); // Ensure this path is correct
const authMiddleware = require("../middleware/authMiddleware");

// Send a message
router.post("/message", authMiddleware.protect, chatController.sendMessage); // Correct the usage of chatController

// Get all messages for a user
router.get("/messages", authMiddleware.protect, chatController.getMessages); // Correct the usage of chatController

module.exports = router;
