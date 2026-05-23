import express, { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../firebase";
import { sendMail } from "../config/mailer";

const router = express.Router();

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_access_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret";
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10");
const MAX_OTP_ATTEMPTS = 5;

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(10), // e.g., +919876543210
  password: z.string().min(8),
});

const loginSchema = z.object({
  identifier: z.string(), // email or phone
  password: z.string(),
});

const verifyOtpSchema = z.object({
  userId: z.string(),
  otp: z.string().length(6),
  type: z.enum(["email-verify", "phone-verify", "password-reset"]),
});

const resetPasswordSchema = z.object({
  token: z.string(), // this will be the reset token
  newPassword: z.string().min(8),
});

// Helpers
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const createAndSendOTP = async (userId: string, email: string, phone: string, type: string) => {
  const otpCode = generateOTP();
  const hashedOtp = await bcrypt.hash(otpCode, BCRYPT_SALT_ROUNDS);
  
  const otpRef = db.ref('otps').push();
  const otpId = otpRef.key;
  
  await otpRef.set({
    id: otpId,
    userId,
    otp: hashedOtp,
    type,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    isUsed: false,
    attempts: 0,
    createdAt: new Date().toISOString()
  });

  // Send Email
  if (email) {
    const subject = type === "password-reset" ? "Reset Your KisanMart Password" : "Verify Your KisanMart Account";
    const html = `<p>Your OTP is: <strong>${otpCode}</strong>. It will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>`;
    await sendMail(email, subject, html).catch(err => console.error("OTP Email Error:", err));
  }

  // TODO: Send SMS via MSG91/Twilio if phone is provided
  if (phone) {
    console.log(`[SMS MOCK] Sending OTP ${otpCode} to ${phone}`);
  }

  return otpId;
};

// ─── REGISTER ──────────────────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if email or phone exists
    const usersSnap = await db.ref('users').once('value');
    const users = usersSnap.val() || {};
    
    for (const key in users) {
      if (users[key].email === data.email) return res.status(400).json({ error: "Email already registered" });
      if (users[key].phone === data.phone) return res.status(400).json({ error: "Phone number already registered" });
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);
    
    const newUserRef = db.ref('users').push();
    const userId = newUserRef.key as string;

    await newUserRef.set({
      id: userId,
      uid: userId, // for backwards compatibility
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await createAndSendOTP(userId, data.email, data.phone, "email-verify");

    res.status(201).json({ success: true, userId, message: "User registered. OTP sent to email and phone." });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: (err as any).errors });
    res.status(500).json({ error: "Server error during registration" });
  }
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);

    const usersSnap = await db.ref('users').once('value');
    const users = usersSnap.val() || {};
    
    let user: any = null;
    let userId: string = "";
    
    for (const key in users) {
      if (users[key].email === identifier.toLowerCase() || users[key].phone === identifier) {
        user = users[key];
        userId = key;
        break;
      }
    }

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Handle legacy passwords (non-bcrypt) from Firebase sync safely
    let isMatch = false;
    if (user.password && user.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else if (user.password) {
      // Legacy or mock passwords
      isMatch = user.password === Buffer.from(password).toString('base64') || user.password === password;
    }

    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.isActive) return res.status(403).json({ error: "Account is disabled" });

    // Generate JWTs
    const accessToken = jwt.sign({ userId, role: user.role }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    // Store refresh token
    await db.ref(`refreshTokens/${crypto.randomUUID()}`).set({
      userId,
      token: await bcrypt.hash(refreshToken, 10), // Hash the refresh token in DB
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      isRevoked: false,
      createdAt: new Date().toISOString()
    });

    await db.ref(`users/${userId}`).update({ lastLoginAt: new Date().toISOString() });

    // Remove password from response
    const { password: _, ...safeUser } = user;

    res.json({ success: true, accessToken, refreshToken, user: safeUser });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed" });
    res.status(500).json({ error: "Server error during login" });
  }
});

// ─── VERIFY OTP ────────────────────────────────────────────────────────────
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { userId, otp, type } = verifyOtpSchema.parse(req.body);

    const otpsSnap = await db.ref('otps').orderByChild('userId').equalTo(userId).once('value');
    const otps = otpsSnap.val() || {};
    
    // Find the latest active OTP of the specified type
    let targetOtpRef: string | null = null;
    let targetOtpData: any = null;

    Object.keys(otps).forEach(key => {
      const o = otps[key];
      if (o.type === type && !o.isUsed && o.expiresAt > Date.now()) {
        if (!targetOtpData || o.createdAt > targetOtpData.createdAt) {
          targetOtpRef = key;
          targetOtpData = o;
        }
      }
    });

    if (!targetOtpData || !targetOtpRef) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (targetOtpData.attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(otp, targetOtpData.otp);
    
    if (!isMatch) {
      await db.ref(`otps/${targetOtpRef}`).update({ attempts: targetOtpData.attempts + 1 });
      return res.status(400).json({ error: "Incorrect OTP" });
    }

    // OTP matched
    await db.ref(`otps/${targetOtpRef}`).update({ isUsed: true });

    if (type === "email-verify" || type === "phone-verify") {
      await db.ref(`users/${userId}`).update({ isEmailVerified: true, isPhoneVerified: true }); // Simplification
      return res.json({ success: true, message: "Account verified successfully!" });
    }

    if (type === "password-reset") {
      // Issue a short-lived reset token
      const resetToken = jwt.sign({ userId, action: "reset-password" }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
      return res.json({ success: true, resetToken });
    }

    res.status(400).json({ error: "Unknown OTP type" });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed" });
    res.status(500).json({ error: "Server error during OTP verification" });
  }
});

// ─── RESEND OTP ────────────────────────────────────────────────────────────
router.post("/resend-otp", async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !type) return res.status(400).json({ error: "Missing parameters" });

    const userSnap = await db.ref(`users/${userId}`).once('value');
    if (!userSnap.exists()) return res.status(404).json({ error: "User not found" });

    const user = userSnap.val();
    
    // Invalidate existing active OTPs of this type
    const otpsSnap = await db.ref('otps').orderByChild('userId').equalTo(userId).once('value');
    const otps = otpsSnap.val() || {};
    const updates: any = {};
    Object.keys(otps).forEach(key => {
      if (otps[key].type === type && !otps[key].isUsed) {
        updates[`${key}/isUsed`] = true; // Mark as used/invalidated
      }
    });
    if (Object.keys(updates).length > 0) {
      await db.ref('otps').update(updates);
    }

    await createAndSendOTP(userId, user.email, user.phone, type);
    res.json({ success: true, message: "New OTP sent" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error while resending OTP" });
  }
});

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────────
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: "Identifier required" });

    const usersSnap = await db.ref('users').once('value');
    const users = usersSnap.val() || {};
    
    let userId: string | null = null;
    let user: any = null;
    
    for (const key in users) {
      if (users[key].email === identifier.toLowerCase() || users[key].phone === identifier) {
        userId = key;
        user = users[key];
        break;
      }
    }

    if (!userId || !user) {
      // Don't leak whether user exists or not for security
      return res.json({ success: true, message: "If the account exists, an OTP has been sent." });
    }

    await createAndSendOTP(userId, user.email, user.phone, "password-reset");
    res.json({ success: true, message: "If the account exists, an OTP has been sent.", userId });
  } catch (err: any) {
    res.status(500).json({ error: "Server error during forgot password" });
  }
});

// ─── RESET PASSWORD ────────────────────────────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      if (decoded.action !== "reset-password") throw new Error("Invalid token action");
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired reset token" });
    }

    const userId = decoded.userId;
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await db.ref(`users/${userId}`).update({
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    // Invalidate ALL existing refresh tokens
    const tokensSnap = await db.ref('refreshTokens').orderByChild('userId').equalTo(userId).once('value');
    const tokens = tokensSnap.val() || {};
    const updates: any = {};
    Object.keys(tokens).forEach(key => {
      if (!tokens[key].isRevoked) updates[`${key}/isRevoked`] = true;
    });
    if (Object.keys(updates).length > 0) {
      await db.ref('refreshTokens').update(updates);
    }

    res.json({ success: true, message: "Password reset successfully. You can now login." });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed" });
    res.status(500).json({ error: "Server error during reset password" });
  }
});

// ─── REFRESH TOKEN ─────────────────────────────────────────────────────────
router.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token required" });

    // Verify format
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    const userId = decoded.userId;
    
    // Find valid token in DB
    const tokensSnap = await db.ref('refreshTokens').orderByChild('userId').equalTo(userId).once('value');
    const tokens = tokensSnap.val() || {};
    
    let foundTokenRef: string | null = null;
    let foundTokenData: any = null;

    for (const key in tokens) {
      if (!tokens[key].isRevoked && tokens[key].expiresAt > Date.now()) {
        const isMatch = await bcrypt.compare(refreshToken, tokens[key].token);
        if (isMatch) {
          foundTokenRef = key;
          foundTokenData = tokens[key];
          break;
        }
      }
    }

    if (!foundTokenRef) return res.status(403).json({ error: "Refresh token revoked or not found" });

    // Revoke old token (Rotation)
    await db.ref(`refreshTokens/${foundTokenRef}`).update({ isRevoked: true });

    // Generate new tokens
    const userSnap = await db.ref(`users/${userId}`).once('value');
    const user = userSnap.val();

    const newAccessToken = jwt.sign({ userId, role: user.role }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const newRefreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    await db.ref(`refreshTokens/${crypto.randomUUID()}`).set({
      userId,
      token: await bcrypt.hash(newRefreshToken, 10),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      isRevoked: false,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err: any) {
    res.status(500).json({ error: "Server error refreshing token" });
  }
});

// ─── LOGOUT ────────────────────────────────────────────────────────────────
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      // Find and revoke specific token
      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const userId = decoded.userId;
        const tokensSnap = await db.ref('refreshTokens').orderByChild('userId').equalTo(userId).once('value');
        const tokens = tokensSnap.val() || {};
        for (const key in tokens) {
          if (!tokens[key].isRevoked) {
            const isMatch = await bcrypt.compare(refreshToken, tokens[key].token);
            if (isMatch) {
              await db.ref(`refreshTokens/${key}`).update({ isRevoked: true });
              break;
            }
          }
        }
      } catch (e) {
        // Ignore JWT verify errors on logout
      }
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error during logout" });
  }
});

export default router;
