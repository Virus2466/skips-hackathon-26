const User = require("../models/User.js");
const Test = require("../models/Test.js");
const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` },
});

const RecommendationController = {
  // Get recommendations based on course selection
  // Returns array of recommendations with prompts for test generation
  async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const { course } = req.query;

      if (!course) {
        return res.status(400).json({ message: "Course is required" });
      }

      // Fetch user
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Fetch recent tests for this course
      const recentTests = await Test.find({ studentId: userId, subject: course })
        .sort({ createdAt: -1 })
        .limit(5);

      // If user is first-time (no recent tests), generate a starter mock test (beginner)
      let starterTest = null;
      if (!recentTests || recentTests.length === 0) {
        try {
          const starterPrompt = `Generate EXACTLY 5 beginner-level MCQs for the course "${course}". Topic: basic/fundamental concepts. Return ONLY a JSON array of questions where each item has questionText, options (4), correctAnswer, explanation.`;

          const response = await ollama.chat({
            model: "gpt-oss:120b",
            messages: [{ role: "system", content: starterPrompt }],
          });

          const text = response?.message?.content || response?.content || (typeof response === "string" ? response : "");
          const cleaned = String(text).trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/, "").trim();
          const match = cleaned.match(/\[[\s\S]*\]/);
          if (match) {
            const questions = JSON.parse(match[0]);
            if (Array.isArray(questions)) {
              starterTest = {
                title: `Starter Mock Test: ${course}`,
                subject: course,
                questions: questions.map((q) => ({
                  questionText: q.questionText || q.question || q.questionText,
                  options: q.options || q.options || [],
                  correctAnswer: q.correctAnswer || q.correct_answer || null,
                  explanation: q.explanation || null,
                  userAnswer: null,
                  isCorrect: false,
                })),
                generated: true,
              };
            }
          }
        } catch (err) {
          // ignore generation errors, recommendations will still be returned
          console.error('Starter test generation failed', err.message);
        }
      }

      // Get weak topics from recent tests
      const topicsMap = {};
      recentTests.forEach((test) => {
        if (test.questions) {
          test.questions.forEach((q) => {
            if (!q.isCorrect) {
              const topicKey = q.topic || "General";
              if (!topicsMap[topicKey]) {
                topicsMap[topicKey] = { topic: topicKey, count: 0 };
              }
              topicsMap[topicKey].count += 1;
            }
          });
        }
      });

      // Sort weak topics by frequency
      const weakTopics = Object.values(topicsMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Generate recommendations with prompts
      const recommendations = [];

      // If there are weak topics, prioritize them
      if (weakTopics.length > 0) {
        weakTopics.forEach((item) => {
          recommendations.push({
            id: `weak_${item.topic}`,
            title: `Strengthen: ${item.topic}`,
            description: `You struggled with this topic in ${item.count} question(s). Let's practice!`,
            prompt: `Generate a quiz test with 5 MCQs on "${item.topic}" from the course "${course}". Focus on beginner to intermediate difficulty to help strengthen understanding.`,
            difficulty: "intermediate",
            topicFocus: item.topic,
          });
        });
      }

      // Add general practice recommendations
      const generalRecommendations = [
        {
          id: "beginner_practice",
          title: "Beginner Practice: Foundations",
          description: "Start with fundamental concepts to build a strong base.",
          prompt: `Generate a quiz test with 5 beginner-level MCQs on "${course}". Focus on foundational concepts and key definitions.`,
          difficulty: "beginner",
          topicFocus: "Foundations",
        },
        {
          id: "intermediate_practice",
          title: "Intermediate Practice: Applications",
          description: "Test your ability to apply concepts in real scenarios.",
          prompt: `Generate a quiz test with 5 intermediate-level MCQs on "${course}". Include application-based and scenario-based questions.`,
          difficulty: "intermediate",
          topicFocus: "Applications",
        },
        {
          id: "advanced_practice",
          title: "Advanced Challenge: Mastery",
          description: "Push your limits with challenging questions.",
          prompt: `Generate a quiz test with 5 advanced-level MCQs on "${course}". Include complex, multi-step, and analytical questions.`,
          difficulty: "advanced",
          topicFocus: "Advanced Topics",
        },
      ];

      // Combine weak topics + general recommendations (avoid duplicates)
      const allRecommendations = [
        ...recommendations,
        ...generalRecommendations,
      ];

      return res.json({
        success: true,
        course,
        totalRecommendations: allRecommendations.length,
        recommendations: allRecommendations,
        starterTest,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  // Generate quiz test from a prompt by calling Ollama
  async generateTestFromPrompt(req, res) {
    try {
      const userId = req.user.id;
      const { prompt, recommendationId, course, difficulty } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      if (!course) {
        return res.status(400).json({ message: "Course is required" });
      }

      // Fetch user
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Call Ollama to generate quiz
      const systemPrompt = `
You are an expert quiz generator. Generate exactly 5 multiple-choice quiz questions based on the following prompt.

${prompt}

IMPORTANT RULES:
1. Return ONLY a valid JSON array
2. Each question must have: question, options (array of 4), correct_answer, explanation, difficulty
3. Use exactly this format and NOTHING else - no markdown, no extra text
4. correct_answer should be the option index (0, 1, 2, or 3)

Return ONLY this JSON structure:
[
  {
    "questionText": "Question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Short explanation of why this is correct",
    "isCorrect": false,
    "userAnswer": null
  }
]
`;

      const response = await ollama.chat({
        model: "gpt-oss:120b",
        messages: [{ role: "system", content: systemPrompt }],
      });

      // Extract text from response
      const text =
        response?.message?.content ||
        response?.content ||
        (typeof response === "string" ? response : "");

      try {
        // Clean markdown if present
        const cleaned = String(text)
          .trim()
          .replace(/^```json/i, "")
          .replace(/^```/i, "")
          .replace(/```$/, "")
          .trim();

        // Extract JSON array
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("No JSON array found in response");

        const questions = JSON.parse(match[0]);

        if (!Array.isArray(questions)) {
          throw new Error("Response is not an array");
        }

        // Create test document
        const newTest = await Test.create({
          studentId: userId,
          title: `Quiz from ${recommendationId || "Custom Prompt"}`,
          subject: course,
          questions: questions.map((q) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: null,
            isCorrect: false,
            topic: q.topic || course,
          })),
          score: 0,
          createdAt: new Date(),
        });

        return res.status(201).json({
          success: true,
          message: "Quiz generated successfully",
          test: {
            _id: newTest._id,
            title: newTest.title,
            subject: newTest.subject,
            questions: newTest.questions,
            createdAt: newTest.createdAt,
          },
        });
      } catch (parseError) {
        console.error("❌ Failed to parse Ollama response:", text);
        return res.status(502).json({
          error: "Failed to generate quiz from AI",
          detail: parseError.message,
          rawResponse: text.substring(0, 200),
        });
      }
    } catch (error) {
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
};

module.exports = RecommendationController;
