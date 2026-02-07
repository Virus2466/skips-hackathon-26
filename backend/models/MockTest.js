const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: String },
  userAnswer: { type: String },
  correctAnswer: { type: String },
  isCorrect: { type: Boolean, default: false },
});

const MockTestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  subject: { type: String },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 },
  answers: [AnswerSchema],
  status: { type: String, enum: ['completed', 'in-progress', 'scheduled'], default: 'completed' },
  takenAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MockTest', MockTestSchema);
