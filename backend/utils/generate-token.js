const jwt = require('jsonwebtoken');
const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } = require('../config/global.js') || {};

const ACCESS_SECRET = JWT_ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret_please_change';
const REFRESH_SECRET = JWT_REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_TOKEN_SECRET || 'dev_refresh_secret_please_change';

function generateToken(userId, extraPayload = {}) {
  try {
    return jwt.sign(
      Object.assign({ id: userId }, extraPayload),
      ACCESS_SECRET,
      { expiresIn: '1h' },
    );
  } catch (err) {
    console.error('Error generating access token:', err.message);
    throw err;
  }
}

function refreshTokenGenerator(savedUser) {
  try {
    return jwt.sign(
      {
        id: savedUser._id,
        email: savedUser.email,
      },
      REFRESH_SECRET,
      { expiresIn: '7d' },
    );
  } catch (err) {
    console.error('Error generating refresh token:', err.message);
    throw err;
  }
}

generateToken.refreshTokenGenerator = refreshTokenGenerator;

module.exports = generateToken;