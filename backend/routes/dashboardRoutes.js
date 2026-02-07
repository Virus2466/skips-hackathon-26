const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getUserMockTests, getSingleMockTest, createMockTest } = require('../controllers/dashboardController');
// const { getUserMockTests } = require("../controllers/dashboardController");
const { chatWithAI } = require("../controllers/aiController");
// Protect dashboard routes with auth middleware
router.use(authMiddleware);

// Get all previous mock tests for a user
// GET /api/dashboard/tests
router.get('/tests', getUserMockTests);

// Get a single mock test by ID
// GET /api/dashboard/tests/:testId
router.get('/tests/:testId', getSingleMockTest);

// Create a new mock test
// POST /api/dashboard/tests
router.post("/chat", chatWithAI);
router.post('/tests', createMockTest);

module.exports = router;