const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// 🔹 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Set up Cloudinary storage for avatars and posts
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: file.fieldname === "avatar" ? "meetup/avatars" : "meetup/posts", // Separate folders for avatars & posts
      format: "png", // Convert all uploads to PNG
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// 🔹 Initialize multer with Cloudinary storage
const upload = multer({ storage });

module.exports = upload;
