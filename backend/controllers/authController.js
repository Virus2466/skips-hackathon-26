const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generate-token.js");

// Helper to generate Token

// @desc Register new User
// @route POST /auth/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, course, parentPhone  } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash the Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const userPayload = {
      name,
      email,
      password: hashedPassword,
      role: role || "student",
      course: role || null
    };

    // Add course for students
    if ((role || "student") === "student" && course) {
      userPayload.course = course;
    }

    const user = await User.create(userPayload);

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        course: user.course || null,
        parentPhone: user.parentPhone || null,
        phone: user.phone || null,
        token: generateToken(user),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Authenticate a user
// @route POST /api/auth/login

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });

    // 2. Check password matches
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        course: user.course || null,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
