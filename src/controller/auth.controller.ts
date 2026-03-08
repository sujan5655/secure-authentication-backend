import { Request, Response, NextFunction } from "express";
import { User } from "../database/models/user.model";
import bcrypt from "bcrypt";
import generateOTP from "../utils/generateOTP";
import sendEmail from "../utils/email";
import jwt from "jsonwebtoken";
import session from "express-session";
import crypto from "crypto";
import { logActivity } from "../utils/activityLogger";
import { Session } from "../database/models/session.model";
import { parseUserAgent } from "../utils/parseUserAgent";
import { sendLoginAlertEmail, sendAccountLockedEmail } from "../utils/userSecurityEmails";
import { verifyRecaptcha } from "../utils/recaptcha";

// Password policy configuration
const PASSWORD_EXPIRATION_DAYS = 90; // Password expires after 90 days
const PASSWORD_HISTORY_LIMIT = 5; // Keep last 5 passwords in history
const MAX_FAILED_ATTEMPTS_BEFORE_LOCK = 5;
const ACCOUNT_LOCK_DURATION_MINUTES = 30;

 import axios from "axios"
import { IUser } from "../database/models/user.model";
import { getIPAndLocation, getClientIP } from "../utils/ipLocation"; 
// @ts-ignore
import { CaptchaGenerator } from "captcha-canvas";
import { createCanvas } from 'canvas';
import { TypedRequestBody
 } from "../types/express";
 import { VerifyOtpBody } from "../types/otp.types";

// Extend session typing for captcha
declare module "express-session" {
  interface SessionData {
    captcha?: string;
  }
}
export interface DeviceData {
  deviceId: string;
  addedAt: Date;
  location: string;
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
    deviceId?: string;
    captchaToken?: string;
  };
}


// ================= CAPTCHA CONTROLLER =================


export class CaptchaController {
  // Generate CAPTCHA
  captcha = async (req: any, res: any) => {
    const width = 300;
    const height = 100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const text = Math.random().toString(36).substring(2, 8); // 6 chars
    ctx.fillStyle = "#000000";
    ctx.font = "60px Arial";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(text).width;
    const x = (width - textWidth) / 2;
    const y = height / 2;
    ctx.fillText(text, x, y);

    // Save captcha text in session
    req.session.captcha = text;

    res.setHeader("Content-Type", "image/png");
    res.send(canvas.toBuffer());
  }

  // Verify CAPTCHA via API
  verifyCaptcha = async (
    req: Request & { session: session.Session & Partial<session.SessionData> },
    res: Response
  ): Promise<void> => {
    try {
      const { code } = req.body;

      if (this.isCaptchaValid(code, req.session.captcha)) {
        res.send({ success: true, message: "✅ CAPTCHA Verified!" });
        return;
      }

      res.send({ success: false, message: "❌ Wrong CAPTCHA!" });
    } catch (error) {
      console.error("Verification error:", error);
      res
        .status(500)
        .send({ success: false, message: "Server error verifying CAPTCHA." });
    }
  }

  // Internal reusable CAPTCHA validation
  isCaptchaValid(code?: string, sessionCaptcha?: string): boolean {
    if (!code || !sessionCaptcha) return false;
    return code.toLowerCase() === sessionCaptcha.toLowerCase();
  }
}

// Example usage in login







  // async captcha(
  //   req: Request & { session: session.Session & Partial<session.SessionData> },
  //   res: Response
  // ): Promise<void> {
  //   try {
  //     const captcha = new CaptchaGenerator();
  //     // or similar method to set size

  //     const buffer = await captcha.generate(); // returns a buffer

  //     req.session.captcha = captcha.text; // store the text

  //     res.setHeader("Content-Type", "image/png");
  //     res.status(200).send(buffer);
  //   } catch (error: any) {
  //     console.error("Error generating captcha:", error);
  //     res.status(500).send("Error generating captcha");
  //   }
  // }


  

  // Verify CAPTCHA
//   async verifyCaptcha(
//     req: Request & { session: session.Session & Partial<session.SessionData> },
//     res: Response
//   ): Promise<void> {
//     try {
//       const { code } = req.body;
//       if (
//         code &&
//         req.session.captcha &&
//         code.toLowerCase() === req.session.captcha.toLowerCase()
//       ) {
//         res.send({ success: true, message: "✅ CAPTCHA Verified!" });
//         return;
//       }
//       res.send({ success: false, message: "❌ Wrong CAPTCHA!" });
//     } catch (error) {
//       console.error("Verification error:", error);
//       res
//         .status(500)
//         .send({ success: false, message: "Server error verifying CAPTCHA." });
//     }
//   }
// }

// ================= AUTH CONTROLLER =================
class AuthController {
  // Register new user (with reCAPTCHA "I'm not a robot")
  async registerUser(
    req: Request & { session: session.Session & Partial<session.SessionData> },
    res: Response
  ): Promise<void> {
    const { fullName, password, email, confirmPassword, captcha, recaptchaToken } =
      req.body;

    // 1️⃣ Check required fields
    const token = recaptchaToken || captcha;
    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      res.status(400).json({ message: "Please fill all required fields." });
      return;
    }

    // 2️⃣ reCAPTCHA or legacy session CAPTCHA validation
    if (recaptchaToken) {
      const ip = getClientIP(req);
      const valid = await verifyRecaptcha(recaptchaToken, ip);
      if (!valid) {
        res.status(400).json({ message: "Security verification failed. Please complete \"I'm not a robot\" and try again." });
        return;
      }
    } else if (captcha && req.session.captcha) {
      if (captcha.toLowerCase() !== req.session.captcha.toLowerCase()) {
        res.status(400).json({ message: "Invalid CAPTCHA code." });
        return;
      }
      req.session.captcha = undefined;
    } else {
      res.status(400).json({ message: "Please complete the security verification (I'm not a robot)." });
      return;
    }

    // 3️⃣ Email & password checks
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "Email already registered." });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ message: "Passwords do not match." });
      return;
    }

    // 4️⃣ Validate password strength
    const upperCount = (password.match(/[A-Z]/g) || []).length;
    const lowerCount = (password.match(/[a-z]/g) || []).length;
    const numberCount = (password.match(/[0-9]/g) || []).length;
    // Special characters excluding <, >, ?, !, ~
    const specialCount = (password.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length;
    
    if (upperCount < 4 || lowerCount < 4 || numberCount < 3 || specialCount < 3) {
      res.status(400).json({
        message: "Password must have 4 uppercase, 4 lowercase, 3 digits, and 3 special characters (excluding <, >, ?, !, ~).",
      });
      return;
    }

    // 5️⃣ Generate OTP and hash password
    const otp = generateOTP();
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Calculate password expiration date (90 days from now)
    const passwordCreatedAt = new Date();
    const passwordExpiresAt = new Date(passwordCreatedAt);
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + PASSWORD_EXPIRATION_DAYS);

    try {
      const newUser = new User({
        fullName: fullName.trim(),
        password: hashedPassword,
        email,
        role: "user",
        otp,
        otpCreatedAt: new Date(),
        otpExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
        otpVerified: false,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        failedAttempts: 0,
        trustedDevices: [],
        lastLoginIP: "",
        lastLoginLocation: "",
        passwordHistory: [], // Empty history for new users
        passwordCreatedAt: passwordCreatedAt,
        passwordExpiresAt: passwordExpiresAt,
      });


      await newUser.save();

      console.log("✅ User created:", newUser.email);

      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Email Verification</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">Hello <strong>${fullName}</strong>,</p>
                    
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      Thank you for registering with us! To complete your account setup, please verify your email address using the One-Time Password (OTP) below:
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                      <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; display: inline-block; min-width: 200px;">
                        <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                      </div>
                    </div>
                    
                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                      <strong style="color: #ef4444;">⏰ Important:</strong> This code will expire in <strong>2 minutes</strong> for security reasons.
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                        <strong>Security Tip:</strong> Never share this OTP with anyone. Our team will never ask for your verification code.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                      If you didn't create an account, please ignore this email.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} CyberShield Systems. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

      await sendEmail({
        email,
        subject: "Verify your email address",
        html: htmlContent,
      });

      // Log registration activity
      const { ip, location } = getIPAndLocation(req);

      await logActivity({
        userId: (newUser._id as any).toString(),
        userEmail: newUser.email,
        userName: fullName,
        action: "REGISTER",
        description: `New user registered and OTP sent to email from ${location}`,
        ipAddress: ip,
      });

      res.status(200).json({
        message:
          "User registered successfully. Please verify OTP sent to your email.",
        otpExpiresAt: newUser.otpExpiresAt?.getTime(), // Return expiry timestamp for frontend sync
      });
    } catch (error: any) {
      console.error("❌ User creation failed:", error.message);
      res.status(500).json({ message: "User creation failed." });
    }
  }

  // <-- typed user model



// Extended request type (optional)


 async  loginUser(
  req: Request & { session: session.Session & Partial<session.SessionData> },
  res: Response
): Promise<void> {
  const { email, password, deviceId, captchaToken, recaptchaToken } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Missing fields." });
    return;
  }

  try {
    const user = (await User.findOne({ email })) as IUser | null;

    if (!user) {
      res.status(404).json({ message: "No account with this email." });
      return;
    }

    if (!user.otpVerified) {
      res.status(401).json({ message: "Please verify your email with OTP." });
      return;
    }

    // Check if account is locked
    const lockedUntil = (user as any).lockedUntil;
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      res.status(403).json({
        message: "Account is temporarily locked due to too many failed attempts. Try again later or use Forgot Password.",
        lockedUntil: lockedUntil,
      });
      return;
    }

    // reCAPTCHA "I'm not a robot" required for login (or legacy session CAPTCHA after 3 failures)
    if (recaptchaToken) {
      const ip = getClientIP(req);
      const valid = await verifyRecaptcha(recaptchaToken, ip);
      if (!valid) {
        res.status(400).json({
          message: "Security verification failed. Please complete \"I'm not a robot\" and try again.",
          requireCaptcha: user.failedAttempts >= 3,
        });
        return;
      }
    } else if (user.failedAttempts >= 3) {
      const captchaController = new CaptchaController();
      if (!captchaToken || !captchaController.isCaptchaValid(captchaToken, req.session.captcha)) {
        res.status(403).json({
          message: "CAPTCHA verification required or failed.",
          requireCaptcha: true,
        });
        return;
      }
    } else {
      res.status(400).json({
        message: "Please complete the security verification (I'm not a robot).",
      });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      const { ip: failIp } = getIPAndLocation(req);
      await logActivity({
        userId: (user._id as any).toString(),
        userEmail: user.email,
        userName: user.fullName,
        action: "LOGIN_FAILED",
        description: "Failed login attempt",
        ipAddress: failIp || null,
      });
      user.failedAttempts++;
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS_BEFORE_LOCK) {
        const lockUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION_MINUTES * 60 * 1000);
        (user as any).lockedUntil = lockUntil;
        await user.save();
        const { ip } = getIPAndLocation(req);
        sendAccountLockedEmail({
          userEmail: user.email,
          userName: user.fullName,
          failedAttempts: user.failedAttempts,
          ipAddress: ip,
          timestamp: new Date().toLocaleString(),
        }).catch(() => {});
        res.status(403).json({
          message: "Account locked due to too many failed attempts. Check your email for instructions.",
          accountLocked: true,
          lockedUntil: lockUntil.toISOString(),
        });
        return;
      }
      await user.save();
      res.status(403).json({
        message: "Wrong email or password.",
        requireCaptcha: user.failedAttempts >= 3,
      });
      return;
    }

    // Check password expiration
    const now = new Date();
    
    // For existing users without password expiration set, initialize it
    if (!user.passwordCreatedAt || !user.passwordExpiresAt) {
      const passwordCreatedAt = user.passwordCreatedAt || user.created_at || new Date();
      const passwordExpiresAt = new Date(passwordCreatedAt);
      passwordExpiresAt.setDate(passwordExpiresAt.getDate() + PASSWORD_EXPIRATION_DAYS);
      
      user.passwordCreatedAt = passwordCreatedAt;
      user.passwordExpiresAt = passwordExpiresAt;
    }
    
    const passwordExpired = user.passwordExpiresAt && user.passwordExpiresAt < now;
    
    if (passwordExpired) {
      res.status(403).json({
        message: "Your password has expired. Please reset your password.",
        passwordExpired: true,
        resetToken: user.resetPasswordToken || null,
      });
      return;
    }

    // Successful login
    user.failedAttempts = 0;
    (user as any).lockedUntil = null;
    const { ip, location } = getIPAndLocation(req);
    user.lastLoginIP = ip;
    user.lastLoginLocation = location;

    const userAgent = req.headers["user-agent"] || "";
    const { browser, os, deviceType } = parseUserAgent(userAgent);
    const isNewDevice = deviceId ? !user.trustedDevices.some((d: any) => d.deviceId === deviceId) : true;

    if (deviceId) {
      const existingDevice = user.trustedDevices.find(
        (d: any) => d.deviceId === deviceId
      );
      if (!existingDevice) {
        user.trustedDevices.push({
          deviceId,
          addedAt: new Date(),
          location: location,
        });
      } else {
        existingDevice.location = location;
      }
    }

    await user.save();

    const sessionId = crypto.randomBytes(4).toString("base64").replace(/[+/=]/g, "").slice(0, 8);
    await Session.create({
      sessionId,
      userId: (user._id as any).toString(),
      deviceId: deviceId || crypto.randomBytes(8).toString("hex"),
      userAgent,
      ip,
      location,
      browser,
      os,
      deviceType,
      lastActive: new Date(),
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.fullName },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    const loginTimeStr = new Date().toLocaleString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short",
    });
    sendLoginAlertEmail({
      userEmail: user.email,
      userName: user.fullName,
      securityLevel: isNewDevice ? "HIGH" : "LOW",
      time: loginTimeStr,
      ipAddress: ip,
      location: location || "Unknown",
      device: `${browser} on ${os}`,
      sessionId,
      isNewDevice,
    }).catch(() => {});

    await logActivity({
      userId: (user._id as any).toString(),
      userEmail: user.email,
      userName: user.fullName,
      action: "LOGIN",
      description: `User logged in successfully from ${user.lastLoginLocation || location || "Unknown location"}`,
      ipAddress: user.lastLoginIP || ip || null,
      metadata: { sessionId, browser, os, deviceType },
    });

    res.json({
      message: "Welcome back!",
      token,
      role: user.role,
      user: {
        email: user.email,
        name: user.fullName,
      },
      sessionId,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error." });
  }

}

  // Login user
  // async loginUser(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ): Promise<void> {
  //   const { email, password } = req.body;

  //   if (!email || !password) {
  //     res.status(400).json({ message: "Please provide email and password." });
  //     return;
  //   }

  //   try {
  //     const user = await User.findOne({ email });
  //     if (!user) {
  //       res.status(400).json({ message: "No user found with this email" });
  //       return;
  //     }

  //     const isPasswordMatch = bcrypt.compareSync(password, user.password);
  //     if (!isPasswordMatch) {
  //       res.status(403).json({ message: "Invalid email or password." });
  //       return;
  //     }

  //     if (!user.otpVerified) {
  //       res.status(401).json({ message: "Please verify your email with OTP." });
  //       return;
  //     }

  //     const token = jwt.sign(
  //       { id: user._id, email: user.email },
  //       process.env.JWT_SECRET || "your_secret_key_here",
  //       { expiresIn: "1h" }
  //     );

  //     res.status(200).json({ message: "Login successful.", token });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: "Error logging in user." });
  //   }
  // }

  // Verify OTP
  // async verifyOTP(req: Request, res: Response): Promise<void> {
  //   const { email, otp } = req.body;

  //   if (!email || !otp) {
  //     res.status(400).json({ message: "Email and OTP are required." });
  //     return;
  //   }

  //   try {
  //     const user = await User.findOne({ email });

  //     if (!user) {
  //       res.status(404).json({ message: "User not found." });
  //       return;
  //     }

  //     if (user.otpVerified) {
  //       res.status(400).json({ message: "OTP already verified." });
  //       return;
  //     }

  //     if (user.otp !== otp) {
  //       res.status(401).json({ message: "Invalid OTP." });
  //       return;
  //     }

  //     user.otpVerified = true;
  //     await user.save();

  //     res
  //       .status(200)
  //       .json({ success: true, message: "OTP verified successfully." });
  //   } catch (error) {
  //     console.error("OTP verification error:", error);
  //     res.status(500).json({ message: "Error verifying OTP." });
  //   }
  // }

  // Verify OTP - New Logic (unique)
// async verifyOTP (
//   req: TypedRequestBody<VerifyOtpBody>,
//   res: Response
// ): Promise<void> {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       res.status(400).json({ success: false, message: "Email and OTP are required." });
//       return;
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       res.status(404).json({ success: false, message: "User not found." });
//       return;
//     }

//     if (user.otpVerified) {
//       res.status(409).json({ success: false, message: "Email already verified." });
//       return;
//     }

//     // ============================
//     // ✅ CORRECT EXPIRY CHECK HERE
//     // ============================
//     const OTP_EXPIRE_MS = 2 * 60 * 1000; // 2 minutes

//     if (!user.otpCreatedAt) {
//       res.status(410).json({
//         success: false,
//         message: "Your OTP has expired. Please request a new one.",
//       });
//       return;
//     }

//     const timePassed = Date.now() - user.otpCreatedAt.getTime();

//     if (timePassed > OTP_EXPIRE_MS) {
//       res.status(410).json({
//         success: false,
//         message: "Your OTP has expired. Please request a new one.",
//       });
//       return;
//     }

//     // ============================
//     // ❌ WRONG OTP
//     // ============================
//     if (user.otp !== otp) {
//       res.status(401).json({ success: false, message: "Incorrect OTP." });
//       return;
//     }

//     // ============================
//     // 🎉 SUCCESS
//     // ============================
//     user.otpVerified = true;
//     user.otp = null;
//     user.otpCreatedAt = null;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "OTP verified successfully!",
//     });

//   } catch (err) {
//     console.error("Verify OTP Error:", err);
//     res.status(500).json({ success: false, message: "Internal server error." });
//   }
// }

  async verifyOTP(req: TypedRequestBody<VerifyOtpBody>, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP are required." });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    if (user.otpVerified) {
      res.status(409).json({ success: false, message: "Email already verified." });
      return;
    }

    // --- EXPIRY CHECK (NO MORE SYNC ISSUES) ---
    if (!user.otpCreatedAt || !user.otpExpiresAt) {
      res.status(410).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
      return;
    }

    // Check if OTP has expired
    const now = Date.now();
    const expiresAt = user.otpExpiresAt.getTime();
    
    if (now > expiresAt) {
      res.status(410).json({
        success: false,
        message: "OTP expired. Please request a new one.",
        remainingTime: 0, // Return remaining time for frontend sync
      });
      return;
    }

    // --- OTP MATCH ---
    if (user.otp !== otp) {
      // Return remaining time even on wrong OTP so frontend can keep timer accurate
      const remainingTime = Math.max(0, Math.floor((expiresAt - now) / 1000));
      res.status(401).json({ 
        success: false, 
        message: "Incorrect OTP.",
        remainingTime, // Return remaining time for frontend sync
      });
      return;
    }

    // --- SUCCESS ---
    user.otpVerified = true;
    user.otp = null;
    user.otpCreatedAt = null;
    user.otpExpiresAt = null;
    await user.save();

    // Log OTP verification / Account verified activity
    const { ip, location } = getIPAndLocation(req);

    await logActivity({
      userId: (user._id as any).toString(),
      userEmail: user.email,
      userName: user.fullName,
      action: "OTP_VERIFIED",
      description: "Email address verified successfully",
      ipAddress: ip,
      metadata: { source: "Verification System" },
    });

    res.json({ success: true, message: "OTP verified successfully!" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}




  // Get OTP remaining time
  async getOtpRemainingTime(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    try {
      const user = await User.findOne({ email });

      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }

      if (user.otpVerified) {
        res.status(400).json({ message: "Email already verified." });
        return;
      }

      if (!user.otpExpiresAt) {
        res.status(400).json({ 
          message: "No active OTP found.",
          remainingTime: 0,
        });
        return;
      }

      const now = Date.now();
      const expiresAt = user.otpExpiresAt.getTime();
      const remainingTime = Math.max(0, Math.floor((expiresAt - now) / 1000));

      res.json({
        remainingTime,
        otpExpiresAt: expiresAt,
      });
    } catch (error) {
      console.error("Get OTP remaining time error:", error);
      res.status(500).json({ message: "Error getting OTP remaining time." });
    }
  }

  // Resend OTP
async resendOTP(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required." });
    return;
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (user.otpVerified) {
      res.status(400).json({ message: "Email already verified." });
      return;
    }

    // Ensure fullName exists (for backward compatibility with old data)
    // If fullName is missing, set a default value based on email
    let userFullName = user.fullName;
    if (!userFullName || userFullName.trim() === "") {
      // Extract username from email as fallback
      const emailUsername = email.split("@")[0];
      userFullName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
      
      // Update the user record with the default fullName
      await User.updateOne(
        { email },
        { fullName: userFullName }
      );
    }

    const newOTP = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    // Use updateOne to update only OTP fields without triggering full document validation
    await User.updateOne(
      { email },
      {
        otp: newOTP,
        otpCreatedAt: new Date(),
        otpExpiresAt: expiresAt,
      }
    );

    // send email...


      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resend OTP - Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">New Verification Code</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">Hello <strong>${userFullName}</strong>,</p>
                    
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      You've requested a new verification code. Please use the One-Time Password (OTP) below to verify your email address:
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                      <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your New Verification Code</p>
                      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; display: inline-block; min-width: 200px;">
                        <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${newOTP}</p>
                      </div>
                    </div>
                    
                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                      <strong style="color: #ef4444;">⏰ Important:</strong> This code will expire in <strong>2 minutes</strong> for security reasons.
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                        <strong>Security Tip:</strong> Never share this OTP with anyone. Our team will never ask for your verification code.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                      If you didn't request this code, please secure your account immediately.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} CyberShield Systems. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

      await sendEmail({
        email,
        subject: "Resend OTP - Verify your email",
        html: htmlContent,
      });

      res.status(200).json({ 
        message: "OTP resent successfully.",
        otpExpiresAt: expiresAt.getTime(), // Return expiry timestamp for frontend sync
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Error resending OTP." });
    }
  }

  // Forgot Password - send reset link (with reCAPTCHA)
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email, recaptchaToken } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required." });
      return;
    }
    if (!recaptchaToken) {
      res.status(400).json({ message: "Please complete the security verification (I'm not a robot)." });
      return;
    }
    const ip = getClientIP(req);
    const recaptchaValid = await verifyRecaptcha(recaptchaToken, ip);
    if (!recaptchaValid) {
      res.status(400).json({ message: "Security verification failed. Please complete \"I'm not a robot\" and try again." });
      return;
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(200).json({
          message:
            "If that email is registered, you will receive a password reset email shortly.",
        });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = expires;
      (user as any).lockedUntil = null;
      user.failedAttempts = 0;
      await user.save();

      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/resetpassword?token=${resetToken}&email=${email}`;

      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset Request</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">Hello <strong>${user.fullName}</strong>,</p>
                    
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to create a new password for your account:
                    </p>
                    
                    <!-- Reset Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                        Reset My Password
                      </a>
                    </div>
                    
                    <!-- Alternative Link -->
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; font-weight: 500;">Or copy and paste this link into your browser:</p>
                      <p style="margin: 0; word-break: break-all; color: #667eea; font-size: 12px; font-family: 'Courier New', monospace;">${resetUrl}</p>
                    </div>
                    
                    <p style="margin: 25px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                      <strong style="color: #ef4444;">⏰ Important:</strong> This link will expire in <strong>15 minutes</strong> for security reasons.
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                        <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged. If you're concerned about your account security, please contact our support team immediately.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                      This is an automated email. Please do not reply to this message.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} CyberShield Systems. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

      await sendEmail({
        email,
        subject: "Password Reset Request",
        html: htmlContent,
      });

      // Log password reset request activity
      const { ip, location } = getIPAndLocation(req);

      await logActivity({
        userId: (user._id as any).toString(),
        userEmail: user.email,
        userName: user.fullName,
        action: "PASSWORD_RESET_REQUEST",
        description: `User requested password reset from ${location}`,
        ipAddress: ip,
      });

      res.status(200).json({
        message: "Password reset email sent if the email is registered.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error processing password reset." });
    }
  }

  // Reset password using token
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { email, token, newPassword, confirmNewPassword, recaptchaToken } = req.body;

    if (!email || !token || !newPassword || !confirmNewPassword) {
      res
        .status(400)
        .json({ message: "Email, token, and new passwords are required." });
      return;
    }
    if (!recaptchaToken) {
      res.status(400).json({ message: "Please complete the security verification (I'm not a robot)." });
      return;
    }
    const ip = getClientIP(req);
    const recaptchaValid = await verifyRecaptcha(recaptchaToken, ip);
    if (!recaptchaValid) {
      res.status(400).json({ message: "Security verification failed. Please complete \"I'm not a robot\" and try again." });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      res.status(400).json({ message: "New passwords do not match." });
      return;
    }

    try {
      const user = await User.findOne({
        email,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        res
          .status(400)
          .json({ message: "Invalid or expired password reset token." });
        return;
      }

      // Check password strength (same validation as registration)
      const upperCount = (newPassword.match(/[A-Z]/g) || []).length;
      const lowerCount = (newPassword.match(/[a-z]/g) || []).length;
      const numberCount = (newPassword.match(/[0-9]/g) || []).length;
      // Special characters excluding <, >, ?, !, ~
      const specialCount = (newPassword.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length;
      
      if (upperCount < 4 || lowerCount < 4 || numberCount < 3 || specialCount < 3) {
        res.status(400).json({
          message: "Password must have 4 uppercase, 4 lowercase, 3 digits, and 3 special characters (excluding <, >, ?, !, ~).",
        });
        return;
      }

      // Check if new password matches current password
      const matchesCurrent = bcrypt.compareSync(newPassword, user.password);
      if (matchesCurrent) {
        res.status(400).json({
          message: "New password cannot be the same as your current password.",
        });
        return;
      }

      // Check password history - prevent reuse of last 5 passwords
      if (user.passwordHistory && user.passwordHistory.length > 0) {
        for (const oldHashedPassword of user.passwordHistory) {
          const matchesHistory = bcrypt.compareSync(newPassword, oldHashedPassword);
          if (matchesHistory) {
            res.status(400).json({
              message: "You cannot reuse a recently used password. Please choose a different password.",
            });
            return;
          }
        }
      }

      // Store current password in history before updating
      const currentHashedPassword = user.password;
      
      // Add to history (keep last 5 passwords)
      const updatedHistory = [currentHashedPassword, ...(user.passwordHistory || [])];
      if (updatedHistory.length > PASSWORD_HISTORY_LIMIT) {
        updatedHistory.pop(); // Remove oldest password if exceeds limit
      }

      // Hash new password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      
      // Update password and history
      user.password = hashedPassword;
      user.passwordHistory = updatedHistory;
      
      // Update password creation and expiration dates
      const passwordCreatedAt = new Date();
      const passwordExpiresAt = new Date(passwordCreatedAt);
      passwordExpiresAt.setDate(passwordExpiresAt.getDate() + PASSWORD_EXPIRATION_DAYS);
      
      user.passwordCreatedAt = passwordCreatedAt;
      user.passwordExpiresAt = passwordExpiresAt;

      // Clear reset token
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await user.save();

      // Log password reset and password set (for security logs)
      const { ip, location } = getIPAndLocation(req);

      await logActivity({
        userId: (user._id as any).toString(),
        userEmail: user.email,
        userName: user.fullName,
        action: "PASSWORD_RESET",
        description: `User successfully reset password from ${location}`,
        ipAddress: ip,
      });
      await logActivity({
        userId: (user._id as any).toString(),
        userEmail: user.email,
        userName: user.fullName,
        action: "PASSWORD_SET",
        description: "Current password was set",
        ipAddress: ip,
        metadata: { source: "Security System" },
      });

      res
        .status(200)
        .json({ message: "Password has been reset successfully." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error resetting password." });
    }
  }
}

export const captchaController = new CaptchaController();

const authcontroller = new AuthController();
export default authcontroller;
