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
// Register User
const registerUser = async (req, res) => {
  try {
    console.log("📌 Register endpoint hit");

    const { name, email, password, about, personalDetails, role } = req.body;
    console.log("📌 Received Data:", req.body);

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ error: "User already exists." });
    }

    // Validate password complexity
    if (!password || password.length < 6) {
      console.log("❌ Password too short");
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    // Handle avatar file upload
    let avatar = "https://res.cloudinary.com/demo/image/upload/v1597323178/default_avatar.jpg"; // Default avatar
    if (req.file) {
      try {
        console.log("📌 Uploading to Cloudinary...");
        console.log("📌 File received:", req.file);

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "meetup/avatars",
          resource_type: "auto",
        });

        avatar = result.secure_url;
        console.log("✅ Cloudinary Upload Successful:", avatar);
      } catch (error) {
        console.error("❌ Cloudinary Upload Error:", error.message);
        return res.status(500).json({ error: "Avatar upload failed", details: error.message });
      }
    } else {
      console.log("⚠️ No file received for upload.");
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("📌 Password hashed successfully");

    // Create User
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatar,
      about,
      personalDetails,
      role,
    });

    // Save user in DB
    await newUser.save();
    console.log("✅ User saved successfully:", newUser.email);

    if (!process.env.JWT_SECRET) {
      console.warn("⚠️ Warning: JWT_SECRET is not set in environment variables.");
      return res.status(500).json({ error: "Server misconfiguration. Contact support." });
    }

    // Generate Token
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
    console.error("❌ Error in registerUser:", err.message);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};


// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server misconfiguration. Contact support." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      success: true,
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
    res.status(500).json({ error: "Server error", details: error.message });
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
