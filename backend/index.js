const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const AIController = require("./controllers/ollama.controller");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Auth & Dashboard Routes
app.use("/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/recommendations", recommendationRoutes);

// 2. THE AI ENGINE ENDPOINT (Handles Chat, Questions, and Analysis)
// Your Angular app will send { mode: 'chat' } or { mode: 'performance_analysis' } here.
app.post("/api/ai/ask", authMiddleware, AIController.handleRequest);

// 3. TEST SUBMISSION ENDPOINT (The data source for your AI Analysis)
app.post("/api/tests/submit", authMiddleware, async (req, res) => {
  try {
    const Test = require("./models/Test");

    // We spread the body but force the studentId from the token for security
    const testData = {
      ...req.body,
      studentId: req.user.id,
      createdAt: new Date(),
    };

    const newTest = new Test(testData);
    await newTest.save();

    res
      .status(201)
      .json({
        success: true,
        message: "Test results recorded for AI analysis!",
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Error: ", error);
    process.exit(1);
  }
};

connectDB();
