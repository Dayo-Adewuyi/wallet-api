import express from "express";
import { handleInputErrors } from "../middlewares/validation";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from "../handlers/user";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middlewares/validation";

import { protect } from "../modules/auth";

const router = express.Router();


router.post("/register", validateRegister, handleInputErrors, register);

router.post("/login", validateLogin, handleInputErrors, login);

router.get("/logout", protect, logout);

router.post(
  "/password/forgot",
  validateForgotPassword,
  handleInputErrors,
  forgotPassword
);

router.put(
  "/password/reset/:token",
  validateResetPassword,
  handleInputErrors,
  resetPassword
);

export default router;
