import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { AppError } from './errorHandler';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'No token provided or invalid format');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'Authentication required', 'No token provided or invalid format');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      user_id: decoded.id || decoded.user_id,
      username: decoded.username,
      is_admin: decoded.is_admin || decoded.role === 'admin',
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Authentication failed', 'Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Authentication failed', 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.is_admin) {
    throw new AppError(403, 'Forbidden', 'Admin privileges are required for this action');
  }
  next();
};
