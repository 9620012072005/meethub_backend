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
      folder: file.fieldname === "avatar" ? "meetup/avatars" : "meetup/posts", // Separate folders
      format: file.mimetype.split("/")[1] || "png", // Use the uploaded file format or default to png
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`, // Remove spaces in filename
      transformation: [{ width: 500, height: 500, crop: "limit" }], // Optional: Resize images
    };
  },
});

// 🔹 Initialize multer with Cloudinary storage
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 🔹 Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only JPG, JPEG, and PNG are allowed."));
    }
    cb(null, true);
  }
});

module.exports = upload;
