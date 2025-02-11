const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to authenticate users by validating the JWT token
const authenticateUser = async (req, res, next) => {
  let token;

  // Check if the token is provided in the Authorization header and starts with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    try {
      // Extract the token from the header
      token = req.headers.authorization.split(" ")[1];

      // If no token exists in the header
      if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided" });
      }

      // Verify the token using JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the database based on the decoded user ID
      req.user = await User.findById(decoded.id).select("-password"); // Exclude the password field

      // If no user found with the decoded ID, return 404
      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Attach the user object to the request
      console.log("Authenticated user:", req.user); // Debugging log
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      // Log the error for debugging purposes
      console.error("Authentication error:", error.message);

      // Return different messages for specific errors
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token has expired, please login again" });
      }

      // Return a generic invalid token message for other errors
      return res.status(401).json({ message: "Not authorized, token invalid or expired" });
    }
  } else {
    // No token provided in the request
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = authenticateUser;

