const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
    },
  },
  {
    timestamps: true, // This will automatically add `createdAt` and `updatedAt`
  }
);


const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
