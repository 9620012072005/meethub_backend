const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register User
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if name, email, and password are provided
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists by email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the provided data
    const newUser = new User({ name, email, password: hashedPassword });

    // Save the user to the database
    await newUser.save();

    // Create a JWT payload with the user's ID
    const payload = { user: { id: newUser._id } };

    // Generate a JWT token with a 1-day expiration time
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Respond with success message and token
    res.status(201).json({
      message: "User registered successfully",
      token,
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ message: "Error registering user" });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create a JWT payload with the user's ID
    const payload = { user: { id: user._id } };

    // Generate a JWT token with a 1-day expiration time
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Respond with success message and token
    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Error logging in user" });
  }
};
