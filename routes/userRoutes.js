const express = require("express");
const { registerUser, loginUser, getUserProfile } = require("../controllers/userController");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Message = require("../models/Chat");

const router = express.Router();

// Register user
// Register user with Cloudinary avatar upload
router.post("/register", upload.single("avatar"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Store Cloudinary URL instead of local path
    const avatar = req.file ? req.file.path : "https://res.cloudinary.com/your_cloud_name/image/upload/v123456789/default_avatar.png";

    const user = new User({
      name,
      email,
      password, // You should hash this before saving
      avatar,
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Login user
router.post("/login", async (req, res) => {
  try {
    await loginUser(req, res);
  } catch (err) {
    res.status(400).json({ message: "Login failed", error: err.message });
  }
});

// Get user profile (authenticated route)
router.get("/profile", protect, async (req, res) => {
  try {
    await getUserProfile(req, res);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
});

// Get all user profiles (with pagination)
// Get all user profiles (with pagination)
router.get("/profiles", protect, async (req, res) => {
  const { page, limit } = req.query;
  try {
    const query = User.find({ _id: { $ne: req.user._id } }).select("name avatar _id");

    if (page && limit) {
      const currentPage = parseInt(page, 10);
      const perPage = parseInt(limit, 10);
      query.skip((currentPage - 1) * perPage).limit(perPage);
    }

    const users = await query;
    res.status(200).json({ users });
  } catch (err) {
    console.error("Error fetching profiles:", err);
    res.status(500).json({ message: "Failed to fetch user profiles", error: err.message });
  }
});

// Update user profile (Authenticated route)
router.put("/profile/update", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    user.about = req.body.about || user.about;
    user.personalDetails = req.body.personalDetails || user.personalDetails;
    user.role = req.body.role || user.role;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

// Add this route to get a user by their ID
router.get("/:userId", protect, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select("name email avatar role about personalDetails");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user details", error: err.message });
  }
});

// ✅ Get the current logged-in user details
router.get("/auth/currentUser", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select("name email avatar role about personalDetails");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(currentUser);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch current user details", error: err.message });
  }
});


module.exports = router;
