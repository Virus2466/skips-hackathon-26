const jwt = require("jsonwebtoken");
const { JWT_ACCESS_TOKEN_SECRET } = require("../config/global");

const ACCESS_SECRET =
  JWT_ACCESS_TOKEN_SECRET ||
  process.env.JWT_ACCESS_TOKEN_SECRET ||
  "dev_access_secret_please_change";

// Auth middleware to verify JWT and populate req.user
function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

    if (!token) { 
      return res
        .status(401)
        .json({ message: "No token provided. Please login first." });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token", error: error.message });
  }
}

module.exports = authMiddleware;
