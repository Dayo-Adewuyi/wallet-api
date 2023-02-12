import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const comparePasswords = (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = (password) => {
  return bcrypt.hash(password, 5);
};

export const createJWT = async (user) => {
  const token = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  return token;
};

export const protect = (req, res, next) => {
  const bearer = req.headers.authorization;

  if (!bearer) {
    res.status(401);
    res.json({ message: "not authorized" });
    return;
  }

  const [, token] = bearer.split(" ");

  if (!token) {
    res.status(401);
    res.json({ message: "not valid token" });
    return;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (e) {
    console.error(e);
    res.status(401);
    res.json({ message: "not valid token" });
    return;
  }
};

// Create and send token and save in cookie
export const sendToken = async (user, statusCode, res) => {
  // Create JWT Token
  const token = await createJWT(user);

  // Options for cookie
  const options = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRES_TIME) * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};

export const getResetPasswordToken = async () => {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash and set to resetPasswordToken field
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set to expire
  const resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);

  return { resetToken, resetPasswordToken, resetPasswordExpire };
};

export const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Define the email options
  const mailOptions = {
    from: "Prisma",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Actually send the email
  await transporter.sendMail(mailOptions);
};
