// models/ProfileDetails.js
const mongoose = require("mongoose");

const profileDetailsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you're referencing the User model for the receiver
    },
    about: {
      type: String,
      required: true,
    },
    personalDetails: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Software Developer", "Web Designer", "Student", "Working Professional"], // Enum for role validation
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const ProfileDetails = mongoose.model("ProfileDetails", profileDetailsSchema);

module.exports = ProfileDetails;
