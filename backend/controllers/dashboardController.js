const MockTest = require('../models/MockTest');

// GET /api/dashboard/tests?userId=...  (or rely on req.user.id if available)
exports.getUserMockTests = async (req, res) => {
	try {
		const userId = (req.user && req.user.id) || req.params.userId || req.query.userId;

		if (!userId) {
			return res.status(400).json({ message: 'userId is required (in token, params or query)' });
		}

		const tests = await MockTest.find({ user: userId }).sort({ takenAt: -1 }).lean();

		// simple stats for dashboard
		const totalTests = tests.length;
		const stats = {
			totalTests,
			averagePercent: totalTests
				? Math.round((tests.reduce((s, t) => s + (t.total ? (t.score / t.total) * 100 : 0), 0) / totalTests) * 100) / 100
				: 0,
			bestPercent: totalTests
				? Math.round(
						Math.max(...tests.map((t) => (t.total ? (t.score / t.total) * 100 : 0))) * 100,
					) / 100
				: 0,
			lastTakenAt: totalTests ? tests[0].takenAt : null,
		};

		return res.json({ tests, stats });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

