const jwt = require('jsonwebtoken');
const { JWT_REFRESH_TOKEN_SECRET } = require('../config/global.js');

const REFRESH_SECRET =
  JWT_REFRESH_TOKEN_SECRET ||
  process.env.JWT_REFRESH_TOKEN_SECRET ||
  "dev_refresh_secret_please_change";

function generateToken(userId, extraPayload = {}) {
  return jwt.sign(
    Object.assign({ id: userId }, extraPayload),
    REFRESH_SECRET,
    { expiresIn: '7d' },
  );
}

module.exports = generateToken;