const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const cloudinary = require("../utils/cloudinary"); // Import Cloudinary utility

// Utility function to delete an old avatar file
const deleteAvatar = (avatarPath) => {
  if (!avatarPath) return;
  const filePath = path.join(__dirname, "../uploads", avatarPath);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Register user
const registerUser = async (req, res) => {
  const { name, email, password, about, personalDetails, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists." });
    }

    // Validate password complexity
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    // Handle avatar file upload
    let avatar = "/uploads/default_avatar.jpg"; // Default avatar
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: "avatars" });
        avatar = result.secure_url;
      } catch (error) {
        return res.status(500).json({ message: "Avatar upload failed", error: error.message });
      }
    }

    // Create new user object
    const newUser = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10), // Hash password before saving
      avatar,
      about,
      personalDetails,
      role,
    });

    // Save new user in the database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        about: newUser.about,
        personalDetails: newUser.personalDetails,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Error registering user:", err.message);
    res.status(500).json({ error: "Error registering user." });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    // If user does not exist
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        about: user.about,
        personalDetails: user.personalDetails,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Error fetching user profile:", err.message);
    res.status(500).json({ error: "Failed to fetch user profile. Please try again later." });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Received data:", req.body);

    // Upload new avatar to Cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: "avatars" });
        user.avatar = result.secure_url;
      } catch (error) {
        return res.status(500).json({ message: "Avatar upload failed", error: error.message });
      }
    }

    // Update profile fields
    user.name = req.body.name || user.name;
    user.about = req.body.about || user.about;
    user.personalDetails = req.body.personalDetails || user.personalDetails;
    user.role = req.body.role || user.role;

    await user.save();

    console.log("User profile updated:", user);

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };
