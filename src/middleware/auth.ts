import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/queries.ts';

export interface DbUserContext {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  pacePreference: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: DbUserContext;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const email = decodedToken.email || `${decodedToken.uid}@member.local`;
    const fallbackName = email.split('@')[0]?.replace(/[._-]+/g, ' ') || 'Club Runner';
    const displayName =
      (typeof decodedToken.name === 'string' && decodedToken.name.trim()) ||
      fallbackName.replace(/\b\w/g, (ch) => ch.toUpperCase());

    const dbUser = await getOrCreateUser({
      uid: decodedToken.uid,
      email,
      displayName,
      photoUrl: typeof decodedToken.picture === 'string' ? decodedToken.picture : null,
    });

    req.dbUser = {
      id: dbUser.id,
      uid: dbUser.uid,
      email: dbUser.email,
      displayName: dbUser.displayName,
      photoUrl: dbUser.photoUrl,
      pacePreference: dbUser.pacePreference,
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token or syncing user:', error);
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
};
