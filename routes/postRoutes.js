const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authenticateuser");
const cloudinary = require("../utils/cloudinary"); 
const multer = require("multer");
const { createPost, getAllPosts, addComment, getComments, toggleLikePost, getPostDetails, updatePost, deletePost } = require("../controllers/postController");

// Use memory storage (no local file storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to upload image to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (req.file) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "posts" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      req.body.image = result.secure_url; // Save Cloudinary URL in request body
    } catch (error) {
      return res.status(500).json({ message: "Image upload failed", error: error.message });
    }
  }
  next();
};

// @route   POST /api/posts
// @desc    Create a new post with Cloudinary image
// @access  Private
router.post("/", authenticateUser, upload.single("image"), uploadToCloudinary, createPost);

// @route   PUT /api/posts/:postId
// @desc    Update a post (handles new image upload)
// @access  Private
router.put("/:postId", authenticateUser, upload.single("image"), uploadToCloudinary, updatePost);

// Other Routes (No Changes)
router.get("/", getAllPosts);
router.post("/:postId/comments", authenticateUser, addComment);
router.get("/:postId/comments", getComments);
router.post("/:postId/like", authenticateUser, toggleLikePost);
router.get("/:postId", getPostDetails);
router.delete("/:postId", authenticateUser, deletePost);

module.exports = router;
