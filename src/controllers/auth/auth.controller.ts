import { NextFunction, Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import createHttpError, { HttpError } from "http-errors";
import { User } from "../../models/user.model";
import { checkPassword, hashPassword } from "../../lib/hash";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../lib/email";
import { createAccessToken, createRefreshToken } from "../../lib/token";

function getAppUrl() {
  return process.env.APP_URL || `http://localhost:${process.env.PORT}`;
}

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return next(createHttpError(400, result.error));
    }
    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(
        createHttpError(
          409,
          "Email already in use! Please try with a different email.",
        ),
      );
    }
    const passwordHashed = await hashPassword(password);
    const newlyCreatedUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHashed,
      role: "user",
      isEmailVerified: false,
      twoFactorEnabled: false,
    });

    // email verification
    const verifyToken = jwt.sign(
      {
        sub: newlyCreatedUser.id,
      },
      process.env.JWT_ACCESS_SECRET!,
      {
        expiresIn: "1d",
      },
    );
    const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`;
    await sendEmail(
      newlyCreatedUser.email,
      "Verify Your Email",
      `
        <p>Please verify your email by clicking <a href="${verifyUrl}">here</a><p>
      `,
    );
    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newlyCreatedUser.id,
        name: newlyCreatedUser.name,
        email: newlyCreatedUser.email,
        role: newlyCreatedUser.role,
        isEmailVerified: newlyCreatedUser.isEmailVerified,
      },
    });
  } catch (error) {
    return next(
      error instanceof HttpError
        ? error
        : createHttpError(500, "Internal Server Error"),
    );
  }
}

export async function verifyEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.query.token as string | undefined;
  if (!token) {
    return next(createHttpError(400, "Token is required"));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      sub: string;
    };
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    if (user.isEmailVerified) {
      return res.json({
        message: "Email already verified",
      });
    }
    user.isEmailVerified = true;
    await user.save();
    return res.json({
      message: "Email verified successfully! You can now Login.",
    });
  } catch (error) {
    return next(createHttpError(500, "Internal Server Error"));
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return next(createHttpError(400, result.error));
    }
    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return next(createHttpError(401, "Invalid email or password"));
    }
    const ok = await checkPassword(password, user.passwordHashed);
    if (!ok) {
      return next(createHttpError(400, "Invalid email or password"));
    }
    if (!user.isEmailVerified) {
      return next(
        createHttpError(403, "Email not verified, please verify your email"),
      );
    }
    const accessToken = createAccessToken(
      user.id,
      user.role,
      user.tokenVersion,
    );
    const refreshToken = createRefreshToken(user.id, user.tokenVersion);
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.status(201).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return next(
      error instanceof HttpError
        ? error
        : createHttpError(500, "Internal Server Error"),
    );
  }
}
