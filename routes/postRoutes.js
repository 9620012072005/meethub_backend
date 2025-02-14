const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authenticateuser"); // Import authentication middleware
const multer = require("multer");
const path = require("path");
const cloudinary = require("../utils/cloudinary"); // Import Cloudinary utility
const { createPost, getAllPosts, addComment, getComments, toggleLikePost, getPostDetails, updatePost, deletePost } = require("../controllers/postController");
const cloudinary = require("../utils/cloudinary");

// Set up multer storage (temporarily stores image before Cloudinary upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Temporary folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Create multer instance for image upload
const upload = multer({ storage });

// @route   POST /api/posts
// @desc    Create a new post with Cloudinary image
// @access  Private
router.post("/", authenticateUser, upload.single("image"), async (req, res, next) => {
  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "posts" });
      req.body.image = result.secure_url; // Store Cloudinary URL
    } catch (error) {
      return res.status(500).json({ message: "Image upload failed", error: error.message });
    }
  }
  next();
}, createPost);

// @route   PUT /api/posts/:postId
// @desc    Update a post (handles new image upload)
// @access  Private
router.put("/:postId", authenticateUser, upload.single("image"), async (req, res, next) => {
  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "posts" });
      req.body.image = result.secure_url;
    } catch (error) {
      return res.status(500).json({ message: "Image upload failed", error: error.message });
    }
  }
  next();
}, updatePost);

// Other Routes (No Changes)
router.get("/", getAllPosts);
router.post("/:postId/comments", authenticateUser, addComment);
router.get("/:postId/comments", getComments);
router.post("/:postId/like", authenticateUser, toggleLikePost);
router.get("/:postId", getPostDetails);
router.delete("/:postId", authenticateUser, deletePost);

module.exports = router;
