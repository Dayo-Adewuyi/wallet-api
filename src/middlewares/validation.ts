import { validationResult } from "express-validator";
import { check } from "express-validator";

export const handleInputErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400);
    res.json({ errors: errors.array() });
  } else {
    next();
  }
};

export const validateLogin = [
  check("email", "Please enter a valid email").isEmail(),
  check("password", "Please enter a password").exists(),
  handleInputErrors,
];

export const validateRegister = [
  check("name", "Please enter a name").not().isEmpty(),
  check("email", "Please enter a valid email").isEmail(),
  check("password", "Please enter a password").exists(),
  handleInputErrors,
];

export const validateForgotPassword = [
  check("email", "Please enter a valid email").isEmail(),
  handleInputErrors,
];

export const validateResetPassword = [
  check("password", "Please enter a password").exists(),
  handleInputErrors,
];
