import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
} from "../config/global.js";

export const accessTokenGenerator = (savedUser) => {
  return jwt.sign(
    {
      id: savedUser._id,
      email: savedUser.email,
    },
    JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" },
  );
};

export const refreshTokenGenerator = (savedUser) => {
  return jwt.sign(
    {
      id: savedUser._id,
      email: savedUser.email,
    },
    JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );
};