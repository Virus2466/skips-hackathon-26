const User = require("../models/User");
const Test = require("../models/Test"); // Ensure this points to your Test model
const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` },
});

const AIController = {
  // Use "handleRequest" to match your index.js route
  async handleRequest(req, res) {
    try {
      // 1. Get Student from DB (req.user comes from authMiddleware)
      const student = await User.findById(req.user?.id || req.body.studentId);
      if (!student)
        return res.status(404).json({ message: "Student not found" });

      const { mode, userMessage } = req.body;

      // 2. Decide if we are generating a test or just chatting
      if (mode === "generate_question") {
        return await AIController.generateAdaptiveQuestion(req, res, student);
      } else {
        // Normal Chat Logic
        const response = await ollama.chat({
          model: "gpt-oss:120b",
          messages: [
            {
              role: "system",
              content: `You are a helpful tutor for ${student.name}, an engineering student.`,
            },
            { role: "user", content: userMessage },
          ],
          stream: false,
        });
        return res
          .status(200)
          .json({ success: true, message: response.message.content });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async generateAdaptiveQuestion(req, res, student) {
    // 1. Fetch history
    const lastTest = await Test.findOne({ studentId: student._id })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Use the 'course' field from your UserSchema
    const studentCourse = student.course || "General Engineering";

    // 3. Determine topic based on history or course
    const topic = lastTest ? lastTest.subject : "Foundational Concepts";

    const recentMistake = lastTest
      ? `The student struggled with ${lastTest.subject} previously.`
      : "This is a new session.";

    // 4. Enhanced System Prompt with Course Context
    const systemPrompt = `
    ROLE: Expert Professor in ${studentCourse}.
    STUDENT: ${student.name}.
    TASK: Generate ONE highly technical Multiple Choice Question (MCQ).
    SUBJECT: ${topic}.
    CONTEXT: ${recentMistake} Ensure the difficulty matches a ${studentCourse} curriculum.
    FORMAT: {"question": "text", "options": ["A", "B", "C", "D"], "correct_answer": "text", "explanation": "text"}
    STRICT: Return ONLY valid JSON.
  `;

    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [{ role: "system", content: systemPrompt }],
      format: "json",
      stream: false,
    }); // Clean and Parse JSON
    const text = response.message.content;
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      const questionData = JSON.parse(cleaned);
      return res.status(200).json({ success: true, question: questionData });
    } catch (e) {
      return res
        .status(502)
        .json({ error: "Invalid JSON from AI", raw: cleaned });
    }
  },
};

module.exports = AIController;
