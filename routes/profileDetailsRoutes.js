// routes/profileDetailsRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createProfileDetails,
  getProfileDetails,
  getAllProfileDetails,  // New function to get all profile details
  updateProfileDetails,
  deleteProfileDetails,
} = require("../controllers/profileDetailsController");

const router = express.Router();

// Create profile details (for a user)
router.post("/", protect, createProfileDetails);

// Get profile details (for a user)
router.get("/", protect, getProfileDetails);

// Get all profile details (for all users)
router.get("/all", protect, getAllProfileDetails);  // New route

// Update profile details (for a user)
router.put("/update", protect, updateProfileDetails);

// Delete profile details (for a user)
router.delete("/delete", protect, deleteProfileDetails);

module.exports = router;
