const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer"); // Multer for file uploads



const postRoutes = require("./routes/postRoutes"); // Post routes
const messageRoutes = require('./routes/messageRoutes');

const userRoutes = require("./routes/userRoutes"); // Ensure path is correct
const profileDetailsRoutes = require("./routes/profileDetailsRoutes");

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Allow React frontend to connect
    methods: ["GET", "POST", 'PUT', 'DELETE'],
    credentials: true, // Allow credentials (cookies, etc.)
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Middleware Setup
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from the React frontend
    methods: ["GET", "POST", 'PUT', 'DELETE'],
    credentials: true, // Allow credentials
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json()); // Parse incoming JSON requests
app.use(morgan("dev")); // Log HTTP requests

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Uploads directory created");
}

// Serve static files from 'uploads' directory
app.use("/uploads", express.static(uploadDir));
app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/profiledetails", profileDetailsRoutes);


// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Create unique filenames
  },
});
const upload = multer({ storage });

// MongoDB Connection with better error handling
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// API Routes
app.use("/api/users", userRoutes); // User routes (for fetching profiles)
app.use("/api/posts", postRoutes); // Post routes
app.use("/api/messages", messageRoutes); // Chat routes

// Image upload endpoint (integrated into the server.js)
app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    const imagePath = `/uploads/${req.file.filename}`; // Construct image path
    res.status(201).json({ imagePath }); // Respond with the image URL
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
});
app.use(cors({
  origin: "http://localhost:3000", // React frontend URL
  methods: ["GET", "POST", 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Socket.IO Connection Setup
let users = {}; // To keep track of users and their socket connections

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle user joining the chat
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`User with ID: ${userId}connected`);
  });

  // Handle sending a message
  socket.on("send_message", ({ receiverId, content }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", { content });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId]; // Remove user from the tracking object
        break;
      }
    }
  });
});

// Serve Frontend in Production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "frontend", "build");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(frontendPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

// Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});