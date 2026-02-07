const Test = require("../models/Test.js");
const User = require("../models/User.js");

const mongoose = require("mongoose"); // ← Add this if missing
// GET /api/dashboard/tests - get full dashboard data for the user
// Returns: { user, tests, stats }
exports.getUserMockTests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, subject } = req.query;

    // Build filter for tests
    const filter = { user: userId };
    if (status) filter.status = status;
    if (subject) filter.subject = subject;

    const tests = await Test.find(filter).sort({ takenAt: -1 }).lean();

    // Fetch basic user profile to show on dashboard
    const user = await User.findById(userId)
      .select("name email role phone parentPhone course createdAt")
      .lean();

    // Prepare default stats
    if (!tests || tests.length === 0) {
      const stats = {
        totalTests: 0,
        averagePercent: 0,
        bestPercent: 0,
        lastTakenAt: null,
      };
      return res.json({ user, tests: [], stats });
    }

    // Fast Stats
    const totalTests = tests.length;
    const percentages = tests.map((t) => (t.total ? (t.score / t.total) * 100 : 0));

    const stats = {
      totalTests,
      averagePercent: Math.round(percentages.reduce((a, b) => a + b, 0) / totalTests),
      bestPercent: Math.round(Math.max(...percentages)),
      lastTakenAt: tests[0].takenAt,
    };

    return res.json({ user, tests, stats });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/dashboard/tests/:testId
exports.getSingleMockTest = async (req, res) => {
  try {
    // One-liner: Find by ID AND User to ensure they don't see other people's data
    const test = await Test.findOne({
      _id: new mongoose.Types.ObjectId(req.params.testId), // Convert to ObjectId
      user: req.user.id,
    });

    if (!test) return res.status(404).json({ message: "Test not found" });

    const percentage = test.total
      ? Math.round((test.score / test.total) * 100)
      : 0;
    return res.json({ ...test, percentage });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/dashboard/tests - create a new mock test
exports.createMockTest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, subject, score, total, answers, durationSeconds } = req.body;

    // Validate required fields
    if (!title || score === undefined || total === undefined) {
      return res.status(400).json({
        message: "title, score, and total are required",
      });
    }

    // Create new mock test
    const newTest = await Test.create({
      user: userId,
      title,
      subject: subject || "General",
      score: Math.min(score, total), // Ensure score doesn't exceed total
      total,
      answers: answers || [],
      durationSeconds: durationSeconds || 0,
      status: "completed",
      takenAt: new Date(),
    });

    // Calculate percentage
    const percentage = newTest.total
      ? Math.round((newTest.score / newTest.total) * 100)
      : 0;

    return res.status(201).json({
      message: "Mock test created successfully",
      test: {
        _id: newTest._id,
        title: newTest.title,
        subject: newTest.subject,
        score: newTest.score,
        total: newTest.total,
        percentage,
        durationSeconds: newTest.durationSeconds,
        takenAt: newTest.takenAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
