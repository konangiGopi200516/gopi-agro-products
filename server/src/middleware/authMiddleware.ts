import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { admin } from '../firebase'; // Assuming admin is exported from firebase.ts

// Rate limiter for auth endpoints (100 attempts per 15 min for safe testing and usage)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  legacyHeaders: false,
});

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
