const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authenticateUser"); // Import authentication middleware
const multer = require("multer");
const path = require("path");
const {
  createPost,
  getAllPosts,
  addComment,
  getComments,
  toggleLikePost, // This function will handle both like and unlike
  getPostDetails,
  updatePost, // Added updatePost controller
  deletePost, // Added deletePost controller
} = require("../controllers/postController");

// Set up storage engine for multer (image upload handling)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder where images will be stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instance for image upload
const upload = multer({ storage });

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private (requires authentication)
router.post("/", authenticateUser, upload.single("image"), createPost);

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get("/", getAllPosts);

// @route   POST /api/posts/:postId/comments
// @desc    Add a comment to a post
// @access  Private (requires authentication)
router.post("/:postId/comments", authenticateUser, addComment);

// @route   GET /api/posts/:postId/comments
// @desc    Get all comments for a post
// @access  Public
router.get("/:postId/comments", getComments);

// @route   POST /api/posts/:postId/like
// @desc    Like or unlike a post (toggle)
// @access  Private (requires authentication)
router.post("/:postId/like", authenticateUser, toggleLikePost); // Use toggleLikePost for both like and unlike

// @route   GET /api/posts/:postId
// @desc    Get post details (likes & comments)
// @access  Public
router.get("/:postId", getPostDetails);

// @route   PUT /api/posts/:postId
// @desc    Update a post
// @access  Private (requires authentication)
router.put("/:postId", authenticateUser, upload.single("image"), updatePost); // Use updatePost to update post

// @route   DELETE /api/posts/:postId
// @desc    Delete a post
// @access  Private (requires authentication)
router.delete("/:postId", authenticateUser, deletePost); // Use deletePost to delete post

module.exports = router; 