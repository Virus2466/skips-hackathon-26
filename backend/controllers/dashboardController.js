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

    const totalScored = tests.reduce((sum, t) => sum + (t.score || 0), 0);
    const totalPossible = tests.reduce((sum, t) => sum + (t.total || 5), 0); 

    const averagePercentage = totalPossible > 0 
  ? Math.round((totalScored / totalPossible) * 100) 
  : 0;

    // const averagePercentage = Math.round(scores.reduce((a, b) => a + b, 0) / totalTests);
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
        total: test.total || 0,
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

// GET /api/dashboard/stats - Get quick overview stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const tests = await Test.find({ studentId: userId }).lean();

    if (!tests || tests.length === 0) {
      return res.json({
        totalTests: 0,
        averagePercentage: 0,
        bestScore: 0,
        totalQuestionsAnswered: 0,
        streak: 0,
      });
    }

    const totalTests = tests.length;
    const scores = tests.map((t) => t.score || 0);
    const totalQuestionsAnswered = tests.reduce(
      (sum, t) => sum + (t.questions ? t.questions.length : 0),
      0
    );
    const totalScored = tests.reduce((sum, t) => sum + (t.score || 0), 0);
    const totalPossible = tests.reduce((sum, t) => sum + (t.total || 5), 0);
    const averagePercentage = Math.round((totalScored / totalPossible) * 100) || 0;
    const bestScore = Math.max(...scores) || 0;

    return res.json({
      totalTests,
      averagePercentage,
      bestScore,
      totalQuestionsAnswered,
      streak: 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/dashboard/analytics/subjects - Get subject-wise analytics
exports.getSubjectAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const tests = await Test.find({ studentId: userId }).lean();

    if (!tests || tests.length === 0) {
      return res.json({ subjectAnalytics: [] });
    }

    const subjectMap = {};
    tests.forEach((test) => {
      if (!subjectMap[test.subject]) {
        subjectMap[test.subject] = {
          subject: test.subject,
          totalTests: 0,
          totalScore: 0,
          totalPossible: 0,
          accuracy: 0,
        };
      }
      subjectMap[test.subject].totalTests += 1;
      subjectMap[test.subject].totalScore += test.score || 0;
      subjectMap[test.subject].totalPossible += test.total || 5;
    });

    const subjectAnalytics = Object.values(subjectMap)
      .map((item) => ({
        ...item,
        accuracy: Math.round((item.totalScore / item.totalPossible) * 100),
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    return res.json({ subjectAnalytics });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/dashboard/analytics/topics - Get topic-wise analytics
exports.getTopicAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const tests = await Test.find({ studentId: userId }).lean();

    if (!tests || tests.length === 0) {
      return res.json({ topicAnalytics: [] });
    }

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
      .sort((a, b) => a.accuracy - b.accuracy);

    return res.json({ topicAnalytics });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/dashboard/tests/recent - Get recent tests
exports.getRecentTests = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 10;

    const tests = await Test.find({ studentId: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.json({ tests, total: tests.length });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/dashboard/tests/:testId - Get test details
exports.getTestDetails = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    const test = await Test.findOne({ _id: testId, studentId: userId }).lean();

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Calculate analysis
    const totalQuestions = test.questions ? test.questions.length : 0;
    const correctAnswers = test.questions
      ? test.questions.filter((q) => q.isCorrect).length
      : 0;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    const analysis = {
      totalQuestions,
      correctAnswers,
      wrongAnswers: totalQuestions - correctAnswers,
      accuracy,
      timeSpent: test.timeSpent || 0,
    };

    return res.json({ test, analysis });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// === PARENT DASHBOARD ===
// GET /api/dashboard/parent - Get child's performance for parent
exports.getParentDashboard = async (req, res) => {
  try {
    const parentId = req.user.id;

    // Get parent info
    const parent = await User.findById(parentId)
      .select("name email parentPhone phone student_id")
      .lean();

    if (!parent || !parent.student_id) {
      return res.status(404).json({ message: "No child linked to this parent account" });
    }

    // Get child info
    const child = await User.findById(parent.student_id)
      .select("name email course createdAt")
      .lean();

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    // Get all tests for the child
    const tests = await Test.find({ studentId: parent.student_id }).sort({ createdAt: -1 }).lean();

    if (!tests || tests.length === 0) {
      return res.json({
        child,
        overallStats: {
          totalTests: 0,
          averagePercentage: 0,
          bestScore: 0,
          totalQuestionsAnswered: 0,
        },
        subjectAnalytics: [],
        recentTests: [],
      });
    }

    // Calculate overall stats
    const totalTests = tests.length;
    const scores = tests.map((t) => t.score || 0);
    const totalQuestionsAnswered = tests.reduce(
      (sum, t) => sum + (t.questions ? t.questions.length : 0),
      0
    );
    const totalScored = tests.reduce((sum, t) => sum + (t.score || 0), 0);
    const totalPossible = tests.reduce((sum, t) => sum + (t.total || 5), 0);
    const averagePercentage = Math.round((totalScored / totalPossible) * 100) || 0;
    const bestScore = Math.max(...scores) || 0;

    const overallStats = {
      totalTests,
      averagePercentage,
      bestScore,
      totalQuestionsAnswered,
    };

    // Calculate subject analytics
    const subjectMap = {};
    tests.forEach((test) => {
      if (!subjectMap[test.subject]) {
        subjectMap[test.subject] = {
          subject: test.subject,
          totalTests: 0,
          totalScore: 0,
          totalPossible: 0,
          accuracy: 0,
        };
      }
      subjectMap[test.subject].totalTests += 1;
      subjectMap[test.subject].totalScore += test.score || 0;
      subjectMap[test.subject].totalPossible += test.total || 5;
    });

    const subjectAnalytics = Object.values(subjectMap)
      .map((item) => ({
        ...item,
        accuracy: Math.round((item.totalScore / item.totalPossible) * 100),
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    // Format recent tests (limit to 10)
    const recentTests = tests.slice(0, 10).map((test) => ({
      _id: test._id,
      title: test.title || "Untitled Test",
      subject: test.subject,
      score: test.score || 0,
      total: test.total || 5,
      createdAt: test.createdAt,
    }));

    return res.json({
      child,
      overallStats,
      subjectAnalytics,
      recentTests,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// === TEACHER DASHBOARD ===
// GET /api/dashboard/teacher - Get all students' performance for teacher
exports.getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get teacher info
    const teacher = await User.findById(teacherId)
      .select("name email org")
      .lean();

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Find all students (for now, find students in the same organization)
    // You can modify this logic based on how you want to link students to teachers
    const students = await User.find({ role: "student" })
      .select("_id name email course createdAt")
      .lean();

    // Get performance data for all students
    const studentPerformance = await Promise.all(
      students.map(async (student) => {
        const tests = await Test.find({ studentId: student._id }).lean();

        if (!tests || tests.length === 0) {
          return {
            ...student,
            totalTests: 0,
            averagePercentage: 0,
            bestScore: 0,
          };
        }

        const totalTests = tests.length;
        const scores = tests.map((t) => t.score || 0);
        const totalScored = tests.reduce((sum, t) => sum + (t.score || 0), 0);
        const totalPossible = tests.reduce((sum, t) => sum + (t.total || 5), 0);
        const averagePercentage = Math.round((totalScored / totalPossible) * 100) || 0;
        const bestScore = Math.max(...scores) || 0;

        return {
          ...student,
          totalTests,
          averagePercentage,
          bestScore,
        };
      })
    );

    // Sort students by average percentage (descending) to show top performers
    const sortedStudents = studentPerformance.sort(
      (a, b) => b.averagePercentage - a.averagePercentage
    );

    return res.json({
      teacher,
      students: sortedStudents,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/dashboard/teacher/student/:studentId - Get specific student's performance
exports.getTeacherStudentDetail = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student info
    const student = await User.findById(studentId)
      .select("name email course createdAt")
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get all tests for this student
    const tests = await Test.find({ studentId }).sort({ createdAt: -1 }).lean();

    if (!tests || tests.length === 0) {
      return res.json({
        student,
        overallStats: {
          totalTests: 0,
          averagePercentage: 0,
          bestScore: 0,
          totalQuestionsAnswered: 0,
        },
        subjectAnalytics: [],
        recentTests: [],
      });
    }

    // Calculate overall stats
    const totalTests = tests.length;
    const scores = tests.map((t) => t.score || 0);
    const totalQuestionsAnswered = tests.reduce(
      (sum, t) => sum + (t.questions ? t.questions.length : 0),
      0
    );
    const totalScored = tests.reduce((sum, t) => sum + (t.score || 0), 0);
    const totalPossible = tests.reduce((sum, t) => sum + (t.total || 5), 0);
    const averagePercentage = Math.round((totalScored / totalPossible) * 100) || 0;
    const bestScore = Math.max(...scores) || 0;

    const overallStats = {
      totalTests,
      averagePercentage,
      bestScore,
      totalQuestionsAnswered,
    };

    // Calculate subject analytics
    const subjectMap = {};
    tests.forEach((test) => {
      if (!subjectMap[test.subject]) {
        subjectMap[test.subject] = {
          subject: test.subject,
          totalTests: 0,
          totalScore: 0,
          totalPossible: 0,
          accuracy: 0,
        };
      }
      subjectMap[test.subject].totalTests += 1;
      subjectMap[test.subject].totalScore += test.score || 0;
      subjectMap[test.subject].totalPossible += test.total || 5;
    });

    const subjectAnalytics = Object.values(subjectMap)
      .map((item) => ({
        ...item,
        accuracy: Math.round((item.totalScore / item.totalPossible) * 100),
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    // Format recent tests
    const recentTests = tests.slice(0, 10).map((test) => ({
      _id: test._id,
      title: test.title || "Untitled Test",
      subject: test.subject,
      score: test.score || 0,
      total: test.total || 5,
      createdAt: test.createdAt,
    }));

    return res.json({
      student,
      overallStats,
      subjectAnalytics,
      recentTests,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
