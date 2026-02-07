const User = require("../models/User");
const Test = require("../models/Test");
const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` },
});

const AIController = {
  // THE TRAFFIC COP: Decides which scenario to run
  async handleRequest(req, res) {
    try {
      const student = await User.findById(req.user?.id || req.body.studentId);
      if (!student)
        return res.status(404).json({ message: "Student not found" });

      const { mode, userMessage, selectedCourse } = req.body;

      // SCENARIO 1: Generate a Question
      if (mode === "generate_question") {
        return await AIController.generateAdaptiveQuestion(
          req,
          res,
          student,
          selectedCourse,
        );
      }

      // SCENARIO 2: Actual Analysis of Marks
      else if (mode === "performance_analysis") {
        return await AIController.analyzePerformance(
          req,
          res,
          student,
          selectedCourse,
        );
      }

      // SCENARIO 3: Context-Based Chat
      else {
        return await AIController.handleContextualChat(
          req,
          res,
          student,
          userMessage,
          selectedCourse,
        );
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Logic for Scenario 1: Questions
  async generateAdaptiveQuestion(req, res, student, course) {
    const lastTest = await Test.findOne({
      studentId: student._id,
      subject: course,
    }).sort({ createdAt: -1 });

    const systemPrompt = `Role: Professor in ${student.course}. Task: Generate 1 MCQ for ${course}. 
    Student previous score: ${lastTest ? lastTest.score : "New"}. Return JSON only.`;

    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [{ role: "system", content: systemPrompt }],
      format: "json",
    });

    res
      .status(200)
      .json({ success: true, question: JSON.parse(response.message.content) });
  },

  // Logic for Scenario 2: Analysis (The "Why")
  async analyzePerformance(req, res, student, course) {
    const history = await Test.find({ studentId: student._id, subject: course })
      .sort({ createdAt: -1 })
      .limit(3);

    const analysisPrompt = `Analyze these scores for ${student.name}: ${history.map((h) => h.score).join("% ,")}. 
    Tell the student exactly why they are performing at this level in ${course} and what to do next.`;

    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [{ role: "user", content: analysisPrompt }],
    });

    res.status(200).json({ success: true, analysis: response.message.content });
  },

  // Logic for Scenario 3: Chat
  async handleContextualChat(req, res, student, message, course) {
    const lastTest = await Test.findOne({
      studentId: student._id,
      subject: course,
    }).sort({ createdAt: -1 });

    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [
        {
          role: "system",
          content: `You are a tutor for ${student.name}. Last score in ${course}: ${lastTest?.score || "N/A"}.`,
        },
        { role: "user", content: message },
      ],
    });

    res.status(200).json({ success: true, message: response.message.content });
  },
};

module.exports = AIController;
