const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User'); // Import the User model to populate sender and receiver details
const { authenticateUser } = require('../middleware/authenticateUser'); 
const { sendMessage, getMessages} = require('../controllers/messageController'); // Assuming sendMessage is defined in the controller

// 📩 Send a Message
// 📩 Send a Message
router.post('/send', authenticateUser, async (req, res) => {
    try {
      const { receiverId, content } = req.body;
  
      // Ensure receiverId and content are provided
      if (!receiverId || !content) {
        return res.status(400).json({ message: 'Receiver ID and content are required' });
      }
  
      // Validate receiverId format
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ message: 'Invalid receiver ID' });
      }
  
      // Create a new message and save it
      const message = new Message({
        sender: req.user._id,
        receiver: receiverId,
        content,
      });
  
      await message.save();
  
      // Populate sender details (name, avatar)
      await message.populate('sender', 'name avatar');
      
      res.status(201).json({ message: 'Message sent successfully', data: message });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

// 📩 Get Messages for a Chat

// 📩 Get Messages for a Chat
router.get('/:userId', authenticateUser, async (req, res) => {
  try {
      const { userId } = req.params;
      const currentUserId = req.user._id; // Authenticated user's ID

      console.log("Fetching messages between:", { currentUserId, userId });

      // Validate `userId`
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Fetch chat messages between `currentUserId` and `userId`
      const messages = await Message.find({
          $or: [
              { sender: currentUserId, receiver: userId },
              { sender: userId, receiver: currentUserId },
          ],
      })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });

      // Handle empty messages
      if (!messages.length) {
          return res.status(200).json({ messages: [] }); // Send empty array instead of 404
      }

      res.status(200).json({ messages });
  } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});
  
// 📩 Get Chat Details (Sender and Receiver Info)
// 📩 Get Chat Details (Sender and Receiver Info)
router.get('/chatdetails/:userId', authenticateUser, async (req, res) => {
    try {
      const { userId } = req.params;  // Now this will contain the receiver's ID
  
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
  
      // Fetch the sender and receiver details
      const sender = await User.findById(req.user._id).select('name avatar');
      const receiver = await User.findById(userId).select('name avatar');
  
      if (!sender || !receiver) {
        return res.status(404).json({ message: 'Sender or receiver not found' });
      }
  
      res.status(200).json({
        sender: {
          name: sender.name,
          avatar: sender.avatar,
        },
        receiver: {
          name: receiver.name,
          avatar: receiver.avatar,
        },
      });
    } catch (error) {
      console.error('Error fetching chat details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

module.exports = router;
