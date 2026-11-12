import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, User } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'demand-planner-sop-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is invalid or expired' });
    return;
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: role '${req.user.role}' lacks permission` });
      return;
    }
    next();
  };
};

