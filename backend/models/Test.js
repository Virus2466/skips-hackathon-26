const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true, // e.g., "Midterm Prep"
  },
  subject: {
    type: String,
    required: true, // e.g., "Thermodynamics"
  },
  questions: [
    {
      questionText: String,
      options: [String],
      correctAnswer: String,
      userAnswer: String,
      isCorrect: Boolean,
      topic: String,
      explanation: String,
    },
  ],
  score: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Test", TestSchema);
