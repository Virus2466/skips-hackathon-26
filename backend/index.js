const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const runOllamaChat = require("./utils/data-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 2. Routes
app.use("/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes, authMiddleware); // Protect dashboard routes with authMiddleware
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