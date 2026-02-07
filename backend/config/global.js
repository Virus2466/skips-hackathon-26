const dotenv = require('dotenv');

dotenv.config();

module.exports = {
	JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,
};