import express from "express";
import { db, admin } from "../firebase";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authLimiter } from "../middleware/authMiddleware";
import nodemailer from "nodemailer";
import dns from "dns";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key_123!";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "fallback_refresh_secret_key_456!";

// Helper to log auth events
const logAuthEvent = async (req: express.Request, type: string, uid?: string, details?: any) => {
  try {
    await db.ref("authLogs").push({
      type,
      uid: uid || "unknown",
      ip: req.ip || req.connection?.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      timestamp: new Date().toISOString(),
      details: details || {}
    });
  } catch (error) {
    console.error("Auth Logging Error:", error);
  }
};

// Helper to set cookies
const setAuthCookies = (res: express.Response, uid: string) => {
  const accessToken = jwt.sign({ uid }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ uid }, REFRESH_SECRET, { expiresIn: "7d" });

  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production" || !!process.env.RENDER;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { accessToken, refreshToken };
};

// GET /api/auth/csrf — Provides CSRF Token to Frontend
router.get("/csrf", (req, res) => {
  // For now, just return a simple token. 
  // The real protection comes from SameSite cookies + CORS origin lock.
  res.json({ csrfToken: "ok" });
});

// GET /api/auth/me — Restore Session
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.accessToken || (authHeader && authHeader.split(" ")[1]);
  if (!token) return res.status(401).json({ error: "Unauthenticated" });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userSnapshot = await db.ref(`users/${decoded.uid}`).once("value");
    if (!userSnapshot.exists()) throw new Error("User not found");
    const userData = userSnapshot.val();
    const { passwordHash, ...safeUser } = userData;
    res.json({ user: safeUser });
  } catch (error) {
    res.status(401).json({ error: "Invalid session" });
  }
});

// POST /api/auth/refresh — Refresh Tokens
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET);
    const tokens = setAuthCookies(res, decoded.uid);
    res.json({ success: true, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (error) {
    res.cookie("accessToken", "", { maxAge: 0 });
    res.cookie("refreshToken", "", { maxAge: 0 });
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      await logAuthEvent(req, "LOGOUT", decoded.uid);
    } catch(e) {}
  }

  res.cookie("accessToken", "", { maxAge: 0 });
  res.cookie("refreshToken", "", { maxAge: 0 });
  res.json({ success: true });
});

// POST /api/auth/login
router.post(
  "/login",
  authLimiter,
  async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Normalize email for consistent lookup
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Find user by email
      console.log(`[LOGIN] Attempting login for: ${normalizedEmail}`);
      let usersSnapshot = await db.ref("users").orderByChild("email").equalTo(normalizedEmail).once("value");
      let users = usersSnapshot.val();

      if (!users) {
        // Fallback: search all users case-insensitively
        const allUsersSnap = await db.ref("users").once("value");
        const allUsers = allUsersSnap.val() || {};
        const foundUid = Object.keys(allUsers).find(k => allUsers[k].email?.trim().toLowerCase() === normalizedEmail);
        
        if (foundUid) {
          console.log(`[LOGIN] Found user via case-insensitive fallback: ${foundUid}. Auto-fixing email.`);
          users = { [foundUid]: allUsers[foundUid] };
          // Auto-fix the email in DB to prevent future issues
          await db.ref(`users/${foundUid}`).update({ email: normalizedEmail });
        }
      }

      if (!users) {
        console.log(`[LOGIN] No user found for email: ${normalizedEmail}`);
        await logAuthEvent(req, "LOGIN_FAILED", undefined, { email: normalizedEmail, error: "User not found" });
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const uid = Object.keys(users)[0];
      const user = users[uid];
      console.log(`[LOGIN] Found user: uid=${uid}, hasPasswordHash=${!!user.passwordHash}, verified=${user.verified}`);

      if (!user.passwordHash) {
        console.log(`[LOGIN] User ${uid} has no passwordHash (possibly Google-only account)`);
        return res.status(401).json({ error: "This account uses Google Sign-In. Please use the Google button to log in." });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        console.log(`[LOGIN] Password mismatch for user: ${uid}`);
        await logAuthEvent(req, "LOGIN_FAILED", uid, { error: "Invalid password" });
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (user.locked) {
        await logAuthEvent(req, "ACCOUNT_LOCKED", uid);
        return res.status(403).json({ error: "Account is locked. Please contact support." });
      }

      if (!user.verified) {
        return res.status(403).json({ error: "Please verify your email before logging in." });
      }

      const tokens = setAuthCookies(res, uid);
      await logAuthEvent(req, "LOGIN_SUCCESS", uid);
      console.log(`[LOGIN] ✅ Login successful for user: ${uid}`);

      // Don't send password hash to client
      const { passwordHash, ...safeUser } = user;
      res.json({ user: safeUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/auth/register
router.post(
  "/register",
  authLimiter,
  async (req: express.Request, res: express.Response) => {
    const { fullName, email, mobile, password } = req.body;

    if (!fullName || !email || !mobile || !password || password.length < 8) {
      return res.status(400).json({ error: "All fields are required and password must be at least 8 characters" });
    }

    // Normalize email for consistent storage and lookup
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Check if email already exists
      console.log(`[REGISTER] Attempting registration for: ${normalizedEmail}`);
      const usersSnapshot = await db.ref("users").orderByChild("email").equalTo(normalizedEmail).once("value");
      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        const existingUid = Object.keys(users)[0];
        const existingUser = users[existingUid];
        
        // If user exists, check if password matches
        if (existingUser.passwordHash) {
          const isValid = await bcrypt.compare(password, existingUser.passwordHash);
          if (isValid) {
            // Password matches! Log them in directly.
            const tokens = setAuthCookies(res, existingUid);
            await logAuthEvent(req, "LOGIN_SUCCESS_VIA_REGISTER", existingUid);
            const { passwordHash: _, ...safeUser } = existingUser;
            return res.json({ user: safeUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, message: "Welcome back! Logged in automatically." });
          }
        }
        
        return res.status(400).json({ error: "This email is already registered. Please log in or use the correct password." });
      }

      const uid = "user_" + Date.now().toString(36);
      const passwordHash = await bcrypt.hash(password, 10);

      const userDoc = {
        id: uid,
        uid,
        name: fullName,
        email: normalizedEmail,
        phone: mobile,
        verified: true,
        passwordHash,
        createdAt: new Date().toISOString()
      };

      await db.ref(`users/${uid}`).set(userDoc);

      await logAuthEvent(req, "REGISTER", uid);

      // Auto-login after registration
      const tokens = setAuthCookies(res, uid);
      await logAuthEvent(req, "LOGIN_SUCCESS_VIA_REGISTER", uid);
      const { passwordHash: _, ...safeUser } = userDoc;
      res.json({ user: safeUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, message: "Registration successful. Logged in automatically." });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/auth/google — Handle Google Sign-In from frontend Firebase popup
router.post(
  "/google",
  async (req: express.Request, res: express.Response) => {
    const { profile } = req.body;

    if (!profile || !profile.email) {
      return res.status(400).json({ error: "Missing Google profile data" });
    }

    try {
      const email = profile.email.trim().toLowerCase();

      // Check if user already exists by email
      const usersSnapshot = await db.ref("users").orderByChild("email").equalTo(email).once("value");
      const users = usersSnapshot.val();

      let uid: string;
      let userDoc: any;

      if (!users) {
        // New user — create account from Google profile
        uid = "google_" + Date.now().toString(36);
        userDoc = {
          id: uid,
          name: profile.name || "Google User",
          email: email, // Use lowercased email
          avatar: profile.picture || "",
          verified: true,
          createdAt: new Date().toISOString()
        };
        await db.ref(`users/${uid}`).set(userDoc);
        await logAuthEvent(req, "GOOGLE_REGISTER", uid);
      } else {
        // Existing user — just log them in
        uid = Object.keys(users)[0];
        userDoc = users[uid];
        await logAuthEvent(req, "GOOGLE_LOGIN", uid);
      }

      const tokens = setAuthCookies(res, uid);
      const { passwordHash, ...safeUser } = userDoc;
      res.json({ user: safeUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    } catch (error: any) {
      console.error("Google auth error:", error);
      res.status(401).json({ error: "Google login failed" });
    }
  }
);

const sendEmailViaResend = async (to: string, subject: string, htmlContent: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "KisanMart <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: htmlContent
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Resend API returned status ${response.status}: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
};

const sendSystemEmail = async (to: string, subject: string, htmlContent: string) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    return await sendEmailViaResend(to, subject, htmlContent);
  }

  const mailUser = process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASS;
  if (mailUser && mailPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });

    return await transporter.sendMail({
      from: `"KisanMart" <${mailUser}>`,
      to,
      subject,
      html: htmlContent,
    });
  }

  throw new Error("No email provider configured (missing RESEND_API_KEY or MAIL_USER/MAIL_PASS)");
};

// GET /api/auth/test-email
router.get("/test-email", async (req: express.Request, res: express.Response) => {
  try {
    const testRecipient = (req.query.to as string) || "gopikonangi8@gmail.com";
    console.log(`Sending test email to: ${testRecipient}...`);

    const result = await sendSystemEmail(
      testRecipient,
      "Email Connection Test - KisanMart",
      `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #4CAF50; text-align: center;">🌱 KisanMart Email Test</h2>
          <p>This is a test email confirming that your email system is successfully configured on your server!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #888; text-align: center;">The KisanMart Team</p>
        </div>
      `
    );

    res.json({ success: true, message: `Test email successfully sent to ${testRecipient}!`, result });
  } catch (error: any) {
    console.error("Test email route failed:", error);
    res.status(500).json({ 
      error: error.message || "Failed to send test email", 
      details: error.toString() 
    });
  }
});

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  async (req: express.Request, res: express.Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const normalizedEmail = email.trim().toLowerCase();
      console.log(`Password reset requested for: ${normalizedEmail}`);

      // Generate a JWT for password reset (valid for 15 minutes)
      const oobCode = jwt.sign({ email: normalizedEmail }, JWT_SECRET, { expiresIn: '15m' });
      
      const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://gopi-agro-products.vercel.app";
      const resetLink = `${clientUrl}/reset-password?oobCode=${oobCode}`;
      console.log(`Programmatic reset link generated: ${resetLink}`);

      try {
        await sendSystemEmail(
          normalizedEmail,
          "Password Reset Request - KisanMart",
          `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #4CAF50; text-align: center;">🌱 KisanMart Password Reset</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password for your KisanMart account. Click the button below to choose a new one:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>This password reset link will expire in 15 minutes.</p>
              <p>If you did not request a password reset, please ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
              <p style="font-size: 12px; color: #888; text-align: center;">The KisanMart Team</p>
            </div>
          `
        );
        console.log(`Password reset email sent successfully to ${normalizedEmail}`);
      } catch (emailError: any) {
        console.error("Failed to send password reset email:", emailError.message || emailError);
        // Do not fail the request to prevent email enumeration.
      }

      await logAuthEvent(req, "FORGOT_PASSWORD", undefined, { email: normalizedEmail });
      res.json({ success: true });
    } catch (error) {
      console.error("Forgot password handler error:", error);
      res.json({ success: true });
    }
  }
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  async (req: express.Request, res: express.Response) => {
    try {
      const { oobCode, newPassword } = req.body;

      if (!oobCode || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: "Invalid input" });
      }

      // 1. Verify the JWT OOB code
      let decoded: any;
      try {
        decoded = jwt.verify(oobCode, JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      const resetEmail = decoded.email;
      if (!resetEmail) {
        return res.status(400).json({ error: "Invalid token payload" });
      }

      const normalizedEmail = resetEmail.trim().toLowerCase();

      // 2. Find the user in RTDB and update the passwordHash
      let usersSnapshot = await db.ref("users").orderByChild("email").equalTo(normalizedEmail).once("value");
      let users = usersSnapshot.val();
      
      if (!users) {
        // Fallback: search all users case-insensitively
        const allUsersSnap = await db.ref("users").once("value");
        const allUsers = allUsersSnap.val() || {};
        const foundUid = Object.keys(allUsers).find(k => allUsers[k].email?.trim().toLowerCase() === normalizedEmail);
        
        if (foundUid) {
          console.log(`[RESET PASSWORD] Found user via case-insensitive fallback: ${foundUid}. Auto-fixing email.`);
          users = { [foundUid]: allUsers[foundUid] };
          // Auto-fix the email in DB
          await db.ref(`users/${foundUid}`).update({ email: normalizedEmail });
        }
      }
      
      if (!users) {
        return res.status(404).json({ error: "User account not found" });
      }

      const uid = Object.keys(users)[0];
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      await db.ref(`users/${uid}`).update({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`[RESET PASSWORD] Successfully updated RTDB passwordHash for: ${normalizedEmail} (uid: ${uid})`);

      await logAuthEvent(req, "PASSWORD_RESET_SUCCESS", uid, { email: normalizedEmail });
      res.json({ success: true, email: normalizedEmail });
    } catch (error: any) {
      console.error("Reset password error:", error.message || error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
