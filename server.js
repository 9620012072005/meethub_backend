const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer"); 
const morgan = require("morgan");

const postRoutes = require("./routes/postRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const profileDetailsRoutes = require("./routes/profileDetailsRoutes");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ **Fix: Proper CORS Configuration**
const allowedOrigins = [
  "https://meethub-five.vercel.app",
  "http://localhost:5000"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json()); // ✅ Apply after CORS
app.use(morgan("dev")); 

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Uploads directory created");
}

// Serve static files
app.use("/uploads", express.static(uploadDir));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profiledetails", profileDetailsRoutes);

// ✅ **Fix: Correct WebSocket CORS**
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Image upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    const imagePath = `/uploads/${req.file.filename}`;
    res.status(201).json({ imagePath });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

// Socket.IO Setup
let users = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`User with ID: ${userId} connected`);
  });

  socket.on("send_message", ({ receiverId, content }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", { content });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
  });
});

// Root Route
app.get("/", (req, res) => {
  res.send("MeetUp! API is running...");
});

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
