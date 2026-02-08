const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  getDashboardInfo,
  getDashboardStats,
  getSubjectAnalytics,
  getTopicAnalytics,
  getTestDetails,
  getRecentTests,
  getParentDashboard,
  getTeacherDashboard,
  getTeacherStudentDetail
} = require('../controllers/dashboardController');

// Protect dashboard routes with auth middleware
router.use(authMiddleware);

// === STUDENT DASHBOARD ENDPOINTS ===

// GET /api/dashboard - Get comprehensive dashboard info
// Returns: user profile, overall stats, subject analytics, topic analytics, recent tests
router.get('/', getDashboardInfo);

// GET /api/dashboard/stats - Get quick overview stats only
// Returns: { totalTests, averagePercentage, bestScore, totalQuestionsAnswered, streak }
router.get('/stats', getDashboardStats);

// GET /api/dashboard/analytics/subjects - Get detailed subject-wise analytics
// Returns: { subjectAnalytics: [...] }
router.get('/analytics/subjects', getSubjectAnalytics);

// GET /api/dashboard/analytics/topics - Get detailed topic-wise analytics
// Returns: { topicAnalytics: [...] }
router.get('/analytics/topics', getTopicAnalytics);

// GET /api/dashboard/tests/recent - Get recent tests with limit
// Returns: { tests: [...], total: number }
router.get('/tests/recent', getRecentTests);

// GET /api/dashboard/tests/:testId - Get specific test details
// Returns: { test: {...}, analysis: {...} }
router.get('/tests/:testId', getTestDetails);

// === PARENT DASHBOARD ENDPOINTS ===

// GET /api/dashboard/parent - Get child's performance
router.get('/parent', getParentDashboard);

// === TEACHER DASHBOARD ENDPOINTS ===

// GET /api/dashboard/teacher - Get all students' performance
router.get('/teacher', getTeacherDashboard);

// GET /api/dashboard/teacher/student/:studentId - Get specific student's performance
router.get('/teacher/student/:studentId', getTeacherStudentDetail);

module.exports = router;