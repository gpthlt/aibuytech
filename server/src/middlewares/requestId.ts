import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  id: string;
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = uuidv4();
  (req as RequestWithId).id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
