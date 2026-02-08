const User = require("../models/User");
const Test = require("../models/Test");
const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://localhost:11434",
});

// Helper: remove or mask sensitive information from AI outputs
function redactSensitiveInfo(text, student) {
  if (!text || typeof text !== 'string') return text;

  let out = String(text);

  // Remove explicit MongoDB ObjectId-like tokens (24 hex chars)
  out = out.replace(/\b[0-9a-fA-F]{24}\b/g, '[REDACTED]');

  // Remove any explicit 'id: ...' patterns
  out = out.replace(/id:\s*[^\s,;\n\)]*/gi, 'id: [REDACTED]');

  // Mask email addresses
  out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]');

  // Mask phone numbers (simple patterns)
  out = out.replace(/\+?\d[\d\s()-.]{6,}\d/g, '[REDACTED]');

  // If student object has an _id or other known token, remove exact matches
  try {
    if (student && student._id) {
      const idStr = String(student._id);
      if (idStr && idStr.length > 3) {
        out = out.split(idStr).join('[REDACTED]');
      }
    }
  } catch (e) {}

  return out;
}

// Helper: keep reply point-to-point and short — return first 1-2 sentences
function shortenResponse(text, maxSentences = 2) {
  if (!text || typeof text !== 'string') return text;
  // Split by sentence endings (handles ., !, ?)
  const parts = text.match(/[^.!?]+[.!?]?/g) || [text];
  const taken = parts.slice(0, maxSentences).join(' ').trim();
  // If still long, truncate to ~400 chars
  if (taken.length > 400) return taken.slice(0, 400).trim() + '...';
  return taken;
}

// Helper: Generate mock MCQ questions when Ollama is unavailable
function generateMockQuestions(course, topic, difficulty) {
  const mockQuestionBank = {
    "Math": [
      {
        question: "What is the derivative of x²?",
        options: ["2x", "x", "2x²", "x³"],
        correct_answer: "2x",
        explanation: "Using the power rule: d/dx(x^n) = n·x^(n-1)",
        topic: "Calculus",
        difficulty: "Easy"
      },
      {
        question: "Solve: 2x + 5 = 13",
        options: ["x = 4", "x = 8", "x = 9", "x = 18"],
        correct_answer: "x = 4",
        explanation: "2x = 13 - 5 = 8, so x = 8/2 = 4",
        topic: "Algebra",
        difficulty: "Easy"
      },
      {
        question: "What is the area of a circle with radius 5?",
        options: ["25π", "10π", "50π", "100π"],
        correct_answer: "25π",
        explanation: "Area = πr² = π(5)² = 25π",
        topic: "Geometry",
        difficulty: "Easy"
      },
      {
        question: "Find the sum: 1/2 + 1/4",
        options: ["3/4", "1/6", "2/6", "1/8"],
        correct_answer: "3/4",
        explanation: "1/2 = 2/4, so 2/4 + 1/4 = 3/4",
        topic: "Fractions",
        difficulty: "Easy"
      },
      {
        question: "What is 15% of 200?",
        options: ["30", "20", "15", "50"],
        correct_answer: "30",
        explanation: "15% of 200 = 0.15 × 200 = 30",
        topic: "Percentages",
        difficulty: "Easy"
      }
    ],
    "Science": [
      {
        question: "What is the chemical formula for water?",
        options: ["H₂O", "CO₂", "O₂", "H₂O₂"],
        correct_answer: "H₂O",
        explanation: "Water consists of 2 hydrogen atoms and 1 oxygen atom",
        topic: "Chemistry",
        difficulty: "Easy"
      },
      {
        question: "What is the speed of light?",
        options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
        correct_answer: "3 × 10⁸ m/s",
        explanation: "The speed of light in vacuum is approximately 300,000 km/s",
        topic: "Physics",
        difficulty: "Easy"
      },
      {
        question: "What do plants use photosynthesis to produce?",
        options: ["Glucose and oxygen", "Water and CO₂", "Nitrogen", "Proteins"],
        correct_answer: "Glucose and oxygen",
        explanation: "Photosynthesis converts light energy into chemical energy (glucose) and releases oxygen",
        topic: "Biology",
        difficulty: "Easy"
      },
      {
        question: "What is the atomic number of Carbon?",
        options: ["6", "8", "12", "4"],
        correct_answer: "6",
        explanation: "Carbon has 6 protons in its nucleus",
        topic: "Chemistry",
        difficulty: "Easy"
      },
      {
        question: "Which planet is closest to the Sun?",
        options: ["Mercury", "Venus", "Earth", "Mars"],
        correct_answer: "Mercury",
        explanation: "Mercury is the first planet from the Sun in our solar system",
        topic: "Astronomy",
        difficulty: "Easy"
      }
    ],
    "General": [
      {
        question: "What is the capital of France?",
        options: ["Paris", "Lyon", "Marseille", "Nice"],
        correct_answer: "Paris",
        explanation: "Paris is the capital and largest city of France",
        topic: "Geography",
        difficulty: "Easy"
      },
      {
        question: "In what year did World War II end?",
        options: ["1945", "1944", "1946", "1947"],
        correct_answer: "1945",
        explanation: "World War II officially ended on September 2, 1945",
        topic: "History",
        difficulty: "Easy"
      },
      {
        question: "How many continents are there?",
        options: ["7", "6", "8", "5"],
        correct_answer: "7",
        explanation: "The seven continents are Africa, Antarctica, Asia, Europe, North America, Oceania, and South America",
        topic: "Geography",
        difficulty: "Easy"
      },
      {
        question: "What is the largest ocean on Earth?",
        options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"],
        correct_answer: "Pacific Ocean",
        explanation: "The Pacific Ocean is the largest and deepest ocean",
        topic: "Geography",
        difficulty: "Easy"
      },
      {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Shakespeare", "Marlowe", "Jonson", "Bacon"],
        correct_answer: "Shakespeare",
        explanation: "William Shakespeare is the author of this famous tragedy",
        topic: "Literature",
        difficulty: "Easy"
      }
    ]
  };

  // Select questions from the appropriate category
  const questions = mockQuestionBank[course] || mockQuestionBank["General"];
  
  // Fisher-Yates shuffle to randomly select 5 questions
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

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

    try {
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

        let questions = JSON.parse(match[0]);

        if (!Array.isArray(questions)) throw new Error("Expected array");

        // Helper shuffle
        const shuffle = (arr) => {
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
        };

        // Normalize and shuffle each question's options so correct answer position is randomized
        const normalized = questions.map((q) => {
          const qText = q.question || q.questionText || "";
          const opts = Array.isArray(q.options) ? [...q.options] : [];

          // Determine correct answer (handle index or text)
          let correct = q.correct_answer || q.correctAnswer || null;
          if (typeof correct === 'number') correct = opts[correct] || null;
          else if (typeof correct === 'string' && /^[0-9]+$/.test(correct)) {
            const idx = parseInt(correct, 10);
            correct = opts[idx] || correct;
          }

          if (opts.length > 0) shuffle(opts);
          if (!correct && opts.length > 0) correct = opts[0];

          return {
            question: qText,
            options: opts,
            correct_answer: correct || "",
            explanation: q.explanation || "",
            topic: q.topic || "",
            difficulty: q.difficulty || "",
          };
        });

        // Optional strict count check
        if (normalized.length !== 5) {
          throw new Error(`AI returned ${normalized.length} questions instead of 5`);
        }

        return res.status(200).json({ success: true, questions: normalized });
      } catch (err) {
        console.error("❌ AI Response Parse Error:", err.message);
        console.error("❌ AI RAW OUTPUT:", text);
        throw err;
      }
    } catch (error) {
      // Fallback to mock questions if Ollama fails
      console.warn("⚠️  Ollama unavailable, using mock questions. Error:", error.message);
      
      const mockQuestions = generateMockQuestions(course, topic, difficulty);
      
      // Shuffle options in each question
      const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      };

      const normalized = mockQuestions.map((q) => {
        const opts = [...q.options];
        if (opts.length > 0) shuffle(opts);
        
        return {
          question: q.question,
          options: opts,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          topic: q.topic,
          difficulty: q.difficulty,
        };
      });

      return res.status(200).json({ success: true, questions: normalized });
    }
  },


  async analyzePerformance(req, res, student, course) {
    try {
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

      const data = JSON.parse(response.message.content);
      res.status(200).json({
        success: true,
        subject: course,
        ...data,
      });
    } catch (error) {
      console.warn("⚠️ Performance Analysis Error:", error.message);
      
      // Fallback: calculate simple average score
      try {
        const history = await Test.find({ studentId: student._id, subject: course })
          .sort({ createdAt: -1 })
          .limit(5);
        
        if (history.length === 0) {
          return res.status(200).json({ success: true, confidenceScore: 0, status: "No data" });
        }

        const avgScore = Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length);
        const isImproving = history[0].score > history[history.length - 1].score;
        const status = isImproving ? "Improving" : "Stable";

        res.status(200).json({
          success: true,
          subject: course,
          confidenceScore: avgScore,
          progressStatus: status
        });
      } catch (fallbackError) {
        console.error("Fallback analysis failed:", fallbackError.message);
        res.status(200).json({
          success: true,
          confidenceScore: 50,
          progressStatus: "Unknown",
          subject: course
        });
      }
    }
  },


  // Logic for Scenario 3: Chat
  async handleContextualChat(req, res, student, message, course) {
    try {
      // Decide whether to include private/user context based on the user's message
      // Only include sensitive data (last test marks, personal info) when the user explicitly asks for it.
      const lastTest = await Test.findOne({ studentId: student._id, subject: course }).sort({ createdAt: -1 });

      const needsUserContext = (text) => {
        if (!text || typeof text !== 'string') return false;
        const t = text.toLowerCase();
        // keywords that indicate the user wants personal/test data
        const keywords = [
          'last test', 'last marks', 'my marks', 'my score', 'my last', 'my test', 'my results',
          'how did i', 'tell me my', 'what was my', 'my performance', 'my progress', 'last score'
        ];
        return keywords.some((k) => t.includes(k));
      };

      const includeContext = needsUserContext(message);

      // Build system prompt. Only inject personal data when requested to avoid leaking context to unrelated chats.
      let systemPrompt = `You are an expert AI Tutor.`;
      systemPrompt += `\nINSTRUCTIONS:\n1. Answer the student's question clearly and concisely.\n2. Use helpful, educational tone.`;

      if (course) {
        systemPrompt += `\nCourse context: ${course}.`;
      }

      if (includeContext && lastTest) {
        // Provide a brief, relevant snapshot of the student's last test when explicitly requested
        // DO NOT include any persistent identifiers such as DB ids or emails.
        const takenAt = lastTest.createdAt ? new Date(lastTest.createdAt).toDateString() : 'unknown date';
        const displayName = student && student.name ? student.name.split(' ')[0] : 'Student';
        systemPrompt += `\nStudent: ${displayName} (IDENTIFIER REDACTED). Last test for ${course}: score ${lastTest.score}, takenAt ${takenAt}.`;
      }

      // Add strict brevity + privacy instructions to the system prompt
      systemPrompt += `\nPRIVACY: Do not emit any persistent identifiers (IDs, emails, phone numbers). Replace them with [REDACTED] if needed.`;
      systemPrompt += `\nBrevity: Answer in a short, point-to-point sentence or two, then add a very short 1-2 sentence summary. Keep total length minimal.`;

      // Forward to Ollama with system prompt and user message
      const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }];

      const response = await ollama.chat({ model: 'gpt-oss:120b', messages });

      // Safeguard: redact sensitive tokens and shorten reply before returning to client
      const raw = response?.message?.content || response?.content || '';
      const redacted = redactSensitiveInfo(raw, student);
      const short = shortenResponse(redacted, 2);

      res.status(200).json({ success: true, message: short, raw: undefined });
    } catch (error) {
      console.warn("⚠️ Chat Error (Ollama unavailable):", error.message);
      
      // Provide a friendly fallback response when Ollama is down
      const fallbackResponse = `I'm having trouble processing that right now. Try asking me about:
- Your last test performance
- Study tips for ${course || 'your course'}
- Difficult topics you'd like help with`;

      res.status(200).json({ success: true, message: fallbackResponse, raw: undefined });
    }

    if (includeContext && lastTest) {
      // Provide a brief, relevant snapshot of the student's last test when explicitly requested
      systemPrompt += `\nStudent: ${student.name} (id: ${student._id}). Last test for ${course}: score ${lastTest.score}, takenAt ${lastTest.createdAt || lastTest.createdAt}.`;
    }

    // Forward to Ollama with system prompt and user message
 
    const response = await ollama.chat({ model: 'gpt-oss:120b', messages });

    res.status(200).json({ success: true, message: response.message.content });
  },
};

module.exports = AIController;
