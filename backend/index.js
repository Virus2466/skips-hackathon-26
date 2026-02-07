const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const AIController = require("./controllers/ollama.controller");
// const runOllamaChat = require("./utils/data-fetch"); // Removed: This was auto-running on start

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Routes
app.use("/auth", authRoutes);

// Important: Apply authMiddleware here so the AI knows WHO is asking
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

// AI Endpoint: Added authMiddleware here so req.user.id is available
app.post("/api/ai/ask", authMiddleware, AIController.handleRequest);

// Endpoint for saving test results
app.post("/api/tests/submit", authMiddleware, async (req, res) => {
  try {
    const Test = require("./models/Test");
    // Ensure the studentId comes from the authenticated user for security
    const testData = { ...req.body, studentId: req.user.id };
    const newTest = new Test(testData);
    await newTest.save();
    res.status(201).json({ success: true, message: "Test saved!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Database & Server Start
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Note: runOllamaChat() was running a loop on start-up.
    // Usually, you only want the AI to run when a user hits a route.
  } catch (error) {
    console.error("❌ MongoDB Connection Error: ", error);
    process.exit(1);
  }
};

connectDB();
