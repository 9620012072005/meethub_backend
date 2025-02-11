const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

  content: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Path for image storage (relative)
    required: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model for the user who created the post
    required: true,
  },
 
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model for the user who made the comment
      },
      comment: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model for users who liked the post
    },
  ],
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
