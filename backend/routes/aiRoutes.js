const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect this route so only logged-in users can chat
router.post('/chat', authMiddleware, chatWithAI);

module.exports = router;