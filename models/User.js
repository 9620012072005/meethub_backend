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
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"], // Validates the email format
    },
    password: {
      type: String,
      required: [true, "Password is required"], // Password is required
      minlength: [6, "Password must be at least 6 characters long"], // Password must be at least 6 characters
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/, // Password regex updated for readability
        "Password must include at least one uppercase letter, one number, and one special character.",
      ], // Password must include at least one uppercase letter, one number, and one special character
    },
    avatar: {
      type: String,
      default: null,

    },
    about: {
      type: String,
      default: ''
    },
    personalDetails: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ["Software Developer", "Web Designer", "Student", "Working Professional"], // Enum validation
      required: true,
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
  // Only hash password if it is being modified or is new
  if (!this.isModified("password")) {
    return next(); // If password is not modified, skip hashing
  }

  try {
    const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
    this.password = await bcrypt.hash(this.password, salt); // Hash the password with the salt
    next(); // Proceed with the save operation
  } catch (error) {
    next(error); // Pass the error to the next middleware
  }
});

// Method to compare entered password with the hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Mongoose model export
const User = mongoose.model("User", UserSchema);

module.exports = User;
