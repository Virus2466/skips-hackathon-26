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
    const { topic, difficulty } = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({
        error: "Topic and difficulty are required",
      });
    }

    const lastTest = await Test.findOne({
      studentId: student._id,
      subject: course,
    }).sort({ createdAt: -1 });

    const systemPrompt = `
Generate EXACTLY 5 MCQs for ${course}.
Topic: ${topic}.
Difficulty: ${difficulty}.
Student previous score: ${lastTest ? lastTest.score : "New"}.

Return ONLY valid JSON ARRAY like:
[
  {
    "question": "",
    "options": ["A","B","C","D"],
    "correct_answer": "",
    "explanation": "",
    "topic": "${topic}",
    "difficulty": "${difficulty}"
  }
]

NO TEXT. NO MARKDOWN. JSON ONLY.
`;

    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [{ role: "system", content: systemPrompt }],
    });

    
    const text =
      response?.message?.content ||
      response?.content ||
      (typeof response === "string" ? response : "");

    try {
      // remove markdown if any
      const cleaned = String(text)
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/, "")
        .trim();

      
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No JSON array found");

      const questions = JSON.parse(match[0]);

      if (!Array.isArray(questions)) throw new Error("Expected array");

      // Optional strict count check
      if (questions.length !== 5) {
        return res.status(500).json({
          error: "AI did not return exactly 5 questions",
          count: questions.length,
          raw: questions,
        });
      }

      return res.status(200).json({ success: true, questions });
    } catch (err) {
      console.error("❌ AI RAW OUTPUT:", text);

      return res.status(502).json({
        error: "Failed to parse AI JSON",
        raw: text,
      });
    }
  },


  async analyzePerformance(req, res, student, course) {
    // 1. Fetch all recent tests for this subject
    const history = await Test.find({ studentId: student._id, subject: course })
      .sort({ createdAt: -1 })
      .limit(5); // Analyzing the last 5 tests gives a better "Confidence" number

    if (history.length === 0) {
      return res
        .status(200)
        .json({ success: true, confidenceScore: 0, status: "No data" });
    }

    const scores = history.map((h) => h.score).join(", ");

    // 2. Specialized Prompt for Numerical Output
    const analysisPrompt = `
      System: You are a Student Progress Analyzer.
      Input Scores for ${course}: [${scores}] (Most recent first).
      Task: Calculate a "Subject Mastery Confidence" percentage (0-100).
      Logic: Give more weight to recent scores. If scores are improving, confidence is higher.
      Format: Return ONLY valid JSON: {"confidenceScore": number, "progressStatus": "Improving/Declining/Stable"}
    `;

    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [{ role: "user", content: analysisPrompt }],
      format: "json", // Force JSON format
    });

    try {
      const data = JSON.parse(response.message.content);
      res.status(200).json({
        success: true,
        subject: course,
        ...data,
      });
    } catch (e) {
      res.status(502).json({ error: "Failed to parse numerical analysis" });
    }
  },


  // Logic for Scenario 3: Chat
  async handleContextualChat(req, res, student, message, course) {
    const lastTest = await Test.findOne({
      studentId: student._id,
      subject: course,
    }).sort({ createdAt: -1 });

    const systemPrompt = `
      You are an expert AI Tutor for ${student.name}. 
      Context:
      - Course: ${course}
      - Last Test Score: ${lastTest?.score || "N/A"}
      
      INSTRUCTIONS:
      1. Answer the student's question clearly and concisely.
      2. USE MARKDOWN FORMATTING:
         - Use **Bold** for key terms.
         - Use Bullet points for steps or lists.
         - Use ### Headings for sections.
         - Use Tables if comparing things.
      3. Be encouraging but educational.
    `;

    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    res.status(200).json({ success: true, message: response.message.content });
  },
};

module.exports = AIController;
