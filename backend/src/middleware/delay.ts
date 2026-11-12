import { Request, Response, NextFunction } from 'express';

export const simulatedDelay = (ms = 300) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    setTimeout(next, ms);
  };
};

