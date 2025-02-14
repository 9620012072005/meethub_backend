const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// 🔹 Configure Cloudinary with error handling
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("✅ Cloudinary Config Loaded Successfully");
} catch (error) {
  console.error("❌ Cloudinary Config Error:", error.message);
}

// 🔹 Validate environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Missing Cloudinary environment variables. Check your .env file.");
  process.exit(1); // Stop the app if Cloudinary config is missing
}

// 🔹 Set up Cloudinary storage for avatars and posts
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    try {
     
      console.log("📌 Uploading file:", file?.originalname || "Unknown", "Type:", file?.mimetype || "Unknown");

      return {
        folder: file.fieldname === "avatar" ? "meethub/avatars" : "meethub/posts", // Corrected folder names
        format: file.mimetype.split("/")[1] || "png", // Use the uploaded file format or default to png
        public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`, // Remove spaces in filename
        transformation: [{ width: 500, height: 500, crop: "limit" }], // Optional: Resize images
      };
    } catch (error) {
      console.error("❌ Error generating upload params:", error.message);
      throw error;
    }
  },
});

// 🔹 Initialize multer with Cloudinary storage
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 🔹 Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.mimetype)) {
      console.log("❌ Invalid file type:", file.mimetype);
      return cb(new Error("Invalid file type. Allowed types: JPG, JPEG, PNG, GIF, WebP, SVG."));
    }
    console.log("✅ File accepted:", file.originalname);
    console.log("🛠️ Uploaded file details:", req.file);

    cb(null, true);
  },
});

module.exports = upload;
