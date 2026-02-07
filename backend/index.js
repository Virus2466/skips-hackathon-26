const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const AIController = require("./controllers/ollama.controller");
// const runOllamaChat = require("./utils/data-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 2. Routes
app.use("/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes, authMiddleware); // Protect dashboard routes with authMiddleware
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
// Mongo connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // runOllamaChat().catch((error) => console.error(error));
  } catch (error) {
    console.error("MongoDB Connection Error: ", error);
    // Exit process if connection fails
    process.exit(1);
  }
};

connectDB();
