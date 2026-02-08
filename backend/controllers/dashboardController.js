const Test = require("../models/Test.js");
const User = require("../models/User.js");

const mongoose = require("mongoose");

// GET /api/dashboard - Get comprehensive dashboard info
// Returns: { user, overallStats, subjectAnalytics, topicAnalytics, tests }
exports.getDashboardInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user profile
    const user = await User.findById(userId)
      .select("name email role phone parentPhone course createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Fetch all tests for this user
    const tests = await Test.find({ studentId: userId }).sort({ createdAt: -1 }).lean();

    // If no tests, return empty dashboard
    if (!tests || tests.length === 0) {
      return res.json({
        user,
        overallStats: {
          totalTests: 0,
          averagePercentage: 0,
          bestScore: 0,
          totalQuestionsAnswered: 0,
        },
        subjectAnalytics: [],
        topicAnalytics: [],
        tests: [],
      });
    }

    // 3. Calculate overall stats
    const totalTests = tests.length;
    const scores = tests.map((t) => t.score || 0);
    const totalQuestionsAnswered = tests.reduce(
      (sum, t) => sum + (t.questions ? t.questions.length : 0),
      0
    );

    const averagePercentage = Math.round(scores.reduce((a, b) => a + b, 0) / totalTests);
    const bestScore = Math.max(...scores);

    const overallStats = {
      totalTests,
      averagePercentage,
      bestScore,
      totalQuestionsAnswered,
    };

    // 4. Calculate subject analytics
    const subjectMap = {};
    tests.forEach((test) => {
      if (!subjectMap[test.subject]) {
        subjectMap[test.subject] = {
          subject: test.subject,
          totalTests: 0,
          totalScore: 0,
          averageScore: 0,
          maxScore: 0,
          questionsCount: 0,
          correctCount: 0,
        };
      }
      const correct = test.questions ? test.questions.filter((q) => q.isCorrect).length : 0;
      subjectMap[test.subject].totalTests += 1;
      subjectMap[test.subject].totalScore += test.score || 0;
      subjectMap[test.subject].maxScore = Math.max(subjectMap[test.subject].maxScore, test.score || 0);
      subjectMap[test.subject].questionsCount += test.questions ? test.questions.length : 0;
      subjectMap[test.subject].correctCount += correct;
    });

    const subjectAnalytics = Object.values(subjectMap).map((item) => ({
      ...item,
      averageScore: Math.round(item.totalScore / item.totalTests),
      correctPercentage: item.questionsCount
        ? Math.round((item.correctCount / item.questionsCount) * 100)
        : 0,
    }));

    // 5. Calculate topic/question analytics
    const topicMap = {};
    tests.forEach((test) => {
      if (test.questions) {
        test.questions.forEach((q) => {
          const topicKey = `${test.subject} - Q${test.questions.indexOf(q) + 1}`;
          if (!topicMap[topicKey]) {
            topicMap[topicKey] = {
              topic: topicKey,
              subject: test.subject,
              totalAttempts: 0,
              correctAttempts: 0,
              accuracy: 0,
            };
          }
          topicMap[topicKey].totalAttempts += 1;
          if (q.isCorrect) topicMap[topicKey].correctAttempts += 1;
        });
      }
    });

    const topicAnalytics = Object.values(topicMap)
      .map((item) => ({
        ...item,
        accuracy: Math.round((item.correctAttempts / item.totalAttempts) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy); // Show weakest topics first

    // 6. Format tests for dashboard: include question summaries
    const formattedTests = tests.map((test) => {
      const questions = (test.questions || []).map((q) => {
        const formatted = {
          questionText: q.questionText || q.question || "",
          options: q.options || [],
          isCorrect: !!q.isCorrect,
          userAnswer: q.userAnswer === undefined ? null : q.userAnswer,
          topic: q.topic || test.subject,
        };
        // If the user answered incorrectly, include the correct answer and explanation
        if (!q.isCorrect) {
          formatted.correctAnswer = q.correctAnswer || q.correct_answer || null;
          formatted.explanation = q.explanation || "No explanation available";
        }
        return formatted;
      });

      return {
        _id: test._id,
        title: test.title || test.name || "",
        subject: test.subject,
        score: test.score || 0,
        createdAt: test.createdAt || test.takenAt || null,
        questions,
      };
    });

    return res.json({
      user,
      overallStats,
      subjectAnalytics,
      topicAnalytics,
      tests: formattedTests,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
