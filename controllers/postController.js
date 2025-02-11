const Post = require("../models/Post");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder where images will be stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instance
const upload = multer({ storage });

// Helper function for error handling
const handleServerError = (res, error, message = "Server error") => {
  console.error(message, error);
  res.status(500).json({ message, error: error.message });
};

// Create a new post with or without an image
exports.createPost = async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Post content is required" });
  }

  try {
    let imageUrl = null;

    if (req.file) {
      // Ensure that the image URL has a leading slash before "uploads"
      imageUrl = `/uploads/${req.file.filename.replace(/\\/g, "/")}`; // Add "/" before "uploads"
    }

    const newPost = new Post({
      user: req.user._id,
      content: content.trim(),
      image: imageUrl, // Store the image path with a leading "/"
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name avatar")
      .populate("comments.user", "name avatar")
      .populate("likes", "name")
      .sort({ createdAt: -1 });

    const formattedPosts = posts.map((post) => ({
      ...post.toObject(),
      image: post.image ? `${req.protocol}://${req.get("host")}/${post.image.replace(/\\/g, "/")}` : null, // Corrected URL with /
      user: {
        name: post.user.name,
        avatar: post.user.avatar
          ? `${req.protocol}://${req.get("host")}/${post.user.avatar}` // Corrected URL with /
          : null,
      },
      comments: post.comments.map((comment) => ({
        user: {
          name: comment.user.name,
          avatar: comment.user.avatar
            ? `${req.protocol}://${req.get("host")}/${comment.user.avatar}` // Corrected URL with /
            : null,
        },
        text: comment.comment,
      })),
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    handleServerError(res, error, "Error fetching posts");
  }
};


// Add a comment to a post
exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  if (!comment || comment.trim() === "") {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: req.user._id,
      comment: comment.trim(),
    });

    await post.save();

    const updatedPost = await Post.findById(postId).populate("comments.user", "name avatar");
    res.status(201).json({ message: "Comment added", comments: updatedPost.comments });
  } catch (error) {
    handleServerError(res, error, "Error adding comment");
  }
};

// Get post details
exports.getPostDetails = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId)
      .populate("user", "avatar")
      .populate("comments.user", "avatar")
      .populate("likes", "name");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.status(200).json({
      post: {
        user: {
          avatar: post.user?.avatar ? `${baseUrl}${post.user.avatar}` : null, // Correct URL with / prefix
        },
        likes: post.likes.map((like) => like.name),
        comments: post.comments.map((comment) => ({
          user: {
            avatar: comment.user?.avatar ? `${baseUrl}${comment.user.avatar}` : null, // Correct URL with / prefix
          },
          text: comment.comment,
        })),
        image: post.image ? `${baseUrl}${post.image}` : null, // Correct URL with / prefix
      },
    });
  } catch (error) {
    handleServerError(res, error, "Error fetching post details");
  }
};







// Update a post
exports.updatePost = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own posts" });
    }

    post.content = content.trim() || post.content;

    if (req.file) {
      post.image = `${req.protocol}://${req.get("host")}/${req.file.path}`;
    }

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    handleServerError(res, error, "Error updating post");
  }
};
// Get comments for a post
exports.getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate("comments.user", "name");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post.comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      message: "Server error while fetching comments",
      error: error.message,
    });
  }
};
exports.toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id; // Extract authenticated user ID

    // Use Mongoose to find and update the post in one query
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // Unlike: Remove user ID from the likes array
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like: Add user ID to the likes array
      post.likes.push(userId);
    }

    // Save the updated post
    await post.save();

    return res.status(200).json({
      success: true,
      message: hasLiked ? "Post unliked" : "Post liked",
      userHasLiked: !hasLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// Delete a post
exports.deletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    handleServerError(res, error, "Error deleting post");
  }
};
