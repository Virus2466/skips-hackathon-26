const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },

  password: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    enum: ["student", "parent", "teacher"],
    default: "student",
  },
  parentPhone: {
    type: String,

  },
  phone: {
    type: String,
  },
  org: {
    type: String,
    required: false,
  },
  student_email: {
    type: String,
    required: false,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  course: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
