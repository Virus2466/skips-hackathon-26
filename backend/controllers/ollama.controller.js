const User = require("../models/User");
const Test = require("../models/Test");
const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` },
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
          questionText: qText,
          options: opts,
          correct_answer: correct || "",
          explanation: q.explanation || "",
          topic: q.topic || "",
          difficulty: q.difficulty || "",
        };
      });

      // Optional strict count check
      if (normalized.length !== 5) {
        return res.status(500).json({
          error: "AI did not return exactly 5 questions",
          count: normalized.length,
          raw: normalized,
        });
      }

      return res.status(200).json({ success: true, questions: normalized });
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
  },
};

module.exports = AIController;
