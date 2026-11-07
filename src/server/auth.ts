import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { store, User } from './store.js';

// Cryptographic session secret generated per environment or persistent
const SESSION_SECRET = process.env.SESSION_SECRET || 'cch_super_secure_secret_hash_2026_ci_abj';
const SESSION_COOKIE_NAME = 'cch_session';

export function signToken(userId: number): string {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

export function verifyToken(token: string): number | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const raw = token.includes('%') ? decodeURIComponent(token) : token;
    const parts = raw.split(':');
    if (parts.length !== 3) return null;

    const [userIdStr, timestampStr, signature] = parts;
    const payload = `${userIdStr}:${timestampStr}`;
    const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const timestamp = parseInt(timestampStr, 10);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > thirtyDaysMs) {
      return null; // Expired
    }

    const userId = parseInt(userIdStr, 10);
    return isNaN(userId) ? null : userId;
  } catch (err) {
    return null;
  }
}

export function setSessionCookie(res: Response, user: User) {
  const token = signToken(user.id);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export interface FirebaseDecodedToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

export function parseAndValidateFirebaseToken(
  tokenString: string,
  expectedProjectId = 'substantial-resource-38gvj'
): FirebaseDecodedToken | null {
  if (!tokenString || typeof tokenString !== 'string') return null;
  const parts = tokenString.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('Firebase token expired');
      return null;
    }

    if (payload.aud !== expectedProjectId) {
      console.warn('Firebase token audience mismatch:', payload.aud, expectedProjectId);
      return null;
    }

    if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) {
      console.warn('Firebase token issuer mismatch:', payload.iss);
      return null;
    }

    if (!payload.sub) {
      return null;
    }

    return {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error('Error decoding Firebase token:', err);
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[SESSION_COOKIE_NAME];
  if (token) {
    const userId = verifyToken(token);
    if (userId) {
      const user = store.getUserById(userId);
      if (user) {
        (req as any).user = user;
        return next();
      }
    }
  }

  // Fallback: check if legacy demo cookie exists
  if (req.cookies.cch_auth === 'customer') {
    const defaultUser = store.getUserById(1);
    if (defaultUser) {
      (req as any).user = defaultUser;
      setSessionCookie(res, defaultUser);
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    if (req.headers['x-inertia']) {
      return res.status(401).redirect(303, '/');
    }
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user: User | undefined = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    if (req.headers['x-inertia']) {
      return res.status(403).redirect(303, '/');
    }
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.replace(/[<>]/g, '').trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input !== null && typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}
