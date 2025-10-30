import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    logger.info(`[AUTH] Request to ${req.method} ${req.path}`);
    logger.info(`[AUTH] Authorization header: ${authHeader ? 'Present' : 'Missing'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('[AUTH] No token provided');
      ApiResponse.error(
        res,
        {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
        401
      );
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    logger.info(`[AUTH] Token verified for user: ${payload.email}, role: ${payload.role}`);
    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    logger.error(`[AUTH] Token verification failed: ${error}`);
    ApiResponse.error(
      res,
      {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
      401
    );
  }
};

export const authorize = (...roles: Array<'user' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    logger.info(`[AUTHZ] Checking authorization for roles: ${JSON.stringify(roles)}`);
    logger.info(`[AUTHZ] User object: ${JSON.stringify(user)}`);
    
    if (!user) {
      logger.warn('[AUTHZ] No user found in request');
      ApiResponse.error(
        res,
        {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
        403
      );
      return;
    }
    
    // Trim and normalize the role
    const userRole = String(user.role).trim() as 'user' | 'admin';
    logger.info(`[AUTHZ] Normalized user role: "${userRole}"`);
    logger.info(`[AUTHZ] Includes check result: ${roles.includes(userRole)}`);
    
    if (!roles.includes(userRole)) {
      logger.warn(`[AUTHZ] Access denied - User role: "${userRole}", Required: ${JSON.stringify(roles)}`);
      ApiResponse.error(
        res,
        {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
        403
      );
      return;
    }
    logger.info('[AUTHZ] Access granted');
    next();
  };
};
