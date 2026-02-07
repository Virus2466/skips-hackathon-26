const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getDashboardInfo } = require('../controllers/dashboardController');

// Protect dashboard routes with auth middleware
router.use(authMiddleware);

// Get comprehensive dashboard info (user, stats, analytics, tests)
// GET /api/dashboard
router.get('/', getDashboardInfo);

module.exports = router;