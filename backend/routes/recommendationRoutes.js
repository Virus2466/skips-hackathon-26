const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const RecommendationController = require('../controllers/recommendationController');

// Protect all recommendation routes with auth middleware
router.use(authMiddleware);

// GET /api/recommendations - Get recommendations based on course
router.get('/', RecommendationController.getRecommendations);

// POST /api/recommendations/generate-test - Generate quiz test from prompt
router.post('/generate-test', RecommendationController.generateTestFromPrompt);

module.exports = router;
