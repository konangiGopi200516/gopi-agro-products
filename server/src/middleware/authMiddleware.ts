import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { admin } from '../firebase'; // Assuming admin is exported from firebase.ts

// Rate limiter for auth endpoints (5 attempts per 15 min)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF Protection Middleware
export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  }
});

// Generic middleware to provide a CSRF token
export const generateCsrfToken = (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
};

// Middleware to verify session cookie (for protected routes / me endpoint)
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionCookie = req.cookies?.session || '';
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    (req as any).user = decodedClaims;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
