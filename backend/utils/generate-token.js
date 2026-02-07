const jwt = require('jsonwebtoken');
const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } = require('../config/global.js');

function generateToken(userId, extraPayload = {}) {
  return jwt.sign(
    Object.assign({ id: userId }, extraPayload),
    JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' },
  );
}

function refreshTokenGenerator(savedUser) {
  return jwt.sign(
    {
      id: savedUser._id,
      email: savedUser.email,
    },
    JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' },
  );
}

generateToken.refreshTokenGenerator = refreshTokenGenerator;

module.exports = generateToken;