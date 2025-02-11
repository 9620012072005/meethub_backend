// controllers/profileDetailsController.js
const ProfileDetails = require("../models/ProfileDetails");
const User = require("../models/User");

const createProfileDetails = async (req, res) => {
  try {
    const { about, personalDetails, role } = req.body;
    const userId = req.user._id;

    // Check if profile details already exist for the user
    let profileDetails = await ProfileDetails.findOne({ user: userId });

    if (profileDetails) {
      return res.status(400).json({ message: "Profile details already exist" });
    }

    profileDetails = new ProfileDetails({
      user: userId,
      about,
      personalDetails,
      role,
    });

    await profileDetails.save();
    res.status(201).json({ message: "Profile details created successfully", profileDetails });
  } catch (error) {
    res.status(500).json({ message: "Error creating profile details", error: error.message });
  }
};

const getProfileDetails = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: No user found in request" });
    }

    const userId = req.user._id;
    const profileDetails = await ProfileDetails.findOne({ user: userId });

    if (!profileDetails) {
      return res.status(404).json({ message: "Profile details not found" });
    }

    res.status(200).json({ success: true, data: profileDetails });
  } catch (error) {
    console.error("Error fetching profile details:", error);
    res.status(500).json({ message: "Error fetching profile details", error: error.message });
  }
};
const getAllProfileDetails = async (req, res) => {
  try {
    // Fetch all profile details and populate the user's name and avatar
    const profiles = await ProfileDetails.find()
   
    .populate('user', 'name avatar') // Populate 'name' and 'avatar' from the User model
    .exec();

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ message: "No profiles found." });
    }

    return res.status(200).json({ data: profiles });
  } catch (error) {
    console.error("Error fetching all profile details:", error);
    return res.status(500).json({ message: "Server error, please try again later." });
  }
};



const updateProfileDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { about, personalDetails, role } = req.body;

    const profileDetails = await ProfileDetails.findOne({ user: userId });
    if (!profileDetails) {
      return res.status(404).json({ message: "Profile details not found" });
    }

    profileDetails.about = about || profileDetails.about;
    profileDetails.personalDetails = personalDetails || profileDetails.personalDetails;
    profileDetails.role = role || profileDetails.role;

    await profileDetails.save();
    res.status(200).json({ message: "Profile details updated successfully", profileDetails });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile details", error: error.message });
  }
};

const deleteProfileDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const profileDetails = await ProfileDetails.findOne({ user: userId });
    if (!profileDetails) {
      return res.status(404).json({ message: "Profile details not found" });
    }

    await ProfileDetails.deleteOne({ user: userId });



    res.status(200).json({ message: "Profile details deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting profile details", error: error.message });
  }
};

module.exports = {
  createProfileDetails,
  getProfileDetails,
  updateProfileDetails,
  deleteProfileDetails,
  getAllProfileDetails,
};
