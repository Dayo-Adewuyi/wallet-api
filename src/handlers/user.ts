import prisma from "../db";
import {
  comparePasswords,
  sendToken,
  hashPassword,
  getResetPasswordToken,
  sendEmail,
} from "../modules/auth";
import ErrorHandler from "../modules/errorHandler";
import catchAsyncError from "../middlewares/catchAsyncError";
import crypto from "crypto";

// @desc    Register a user => /api/v1/register
//
export const register = catchAsyncError(async (req, res, next) => {
  const reset = await getResetPasswordToken();
  try {
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: await hashPassword(req.body.password),
        resetPasswordToken: reset.resetPasswordToken,
        resetPasswordExpires: reset.resetPasswordExpire,
      },
    });
    sendToken(user, 200, res);
  } catch (err) {
    next(new ErrorHandler(500, err.message));
  }
});

// @desc    Login user => /api/v1/login
export const login = catchAsyncError(async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });
    if (!user) {
      next(new ErrorHandler(404, "User not found"));
    }

    const isPasswordMatched = await comparePasswords(
      req.body.password,
      user.password
    );
    if (!isPasswordMatched) {
      next(new ErrorHandler(401, "Invalid username or password"));
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(new ErrorHandler(500, err.message));
  }
});

// @desc    Logout user => /api/v1/logout
export const logout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

// @desc    Reset password => /api/v1/password/reset/:token
export const resetPassword = catchAsyncError(async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      next(new ErrorHandler(404, "Token expired"));
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await hashPassword(req.body.password),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    next(new ErrorHandler(500, err.message));
  }
});

// @desc    Forgot password => /api/v1/password/forgot
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      next(new ErrorHandler(404, "User not found"));
    }

    const reset = await getResetPasswordToken();

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetPasswordToken: reset.resetPasswordToken,
        resetPasswordExpires: reset.resetPasswordExpire,
      },
    });

    // Create reset password url
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${reset.resetPasswordToken}`;

    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "ShopIT Password Recovery",
        message,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to: ${user.email}`,
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          resetPasswordToken: user.resetPasswordToken,
          resetPasswordExpires: user.resetPasswordExpires,
        },
      });

      next(new ErrorHandler(500, err.message));
    }
  } catch (err) {
    next(new ErrorHandler(500, err.message));
  }
});
