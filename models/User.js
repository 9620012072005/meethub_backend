const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true, // Trims leading/trailing whitespaces
    },
    email: {
      type: String,
      required: [true, "Email is required"], // Email is required
      unique: true, // Ensures email is unique
      trim: true, // Trims leading/trailing whitespaces
      lowercase: true, // Converts email to lowercase before saving
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"], // Validates email format
    },
    password: {
      type: String,
      required: [true, "Password is required"], // Password is required
      minlength: [6, "Password must be at least 6 characters long"], // Password must be at least 6 characters
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/, // Strong password validation
        "Password must include at least one uppercase letter, one number, and one special character.",
      ],
    },
    avatar: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' fields
  }
);

// Middleware to hash the password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    console.log("📌 Before Hashing:", this.password); // Debug log

    const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
    this.password = await bcrypt.hash(this.password, salt); // Hash the password

    console.log("✅ Hashed Password:", this.password); // Debug log
    next();
  } catch (error) {
    console.error("❌ Error Hashing Password:", error);
    next(error);
  }
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  console.log("📌 Comparing:", enteredPassword, "with", this.password); // Debug log
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export Mongoose model
const User = mongoose.model("User", UserSchema);

module.exports = User;
