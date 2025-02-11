const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes and authenticate users
const protect = async (req, res, next) => {
  let token;

  try {
    // Check if the Authorization header is provided and starts with "Bearer "
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // Extract the token from the Authorization header
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token is found, return an error with a 401 status
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token provided. Please log in to proceed.",
      });
    }

    // Verify the token using JWT_SECRET from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database based on the decoded user ID
    req.user = await User.findById(decoded.id).select("-password"); // Exclude the password field for security

    // If no user is found with the decoded ID, return a 404 error
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach the user object to the request object and proceed
    next();
  } catch (error) {
    // Enhanced logging with timestamp for debugging
    console.error(`[Authorization Error] ${new Date().toISOString()}: ${error.message}`);

    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Your session has expired. Please log in again.",
        type: "TokenExpired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Not authorized. Invalid or malformed token.",
        error: error.message,
      });
    }

    // Handle other JWT-related errors (e.g., token not yet valid)
    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        message: "Token is not yet valid. Please check the token's issuance time.",
        error: error.message,
      });
    }

    // Generic error message for any other issues
    return res.status(500).json({
      message: "Internal server error. Authorization failed.",
      error: error.message,
    });
  }
};

module.exports = { protect };
