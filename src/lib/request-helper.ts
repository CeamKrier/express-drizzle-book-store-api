import { Request, Response, NextFunction } from 'express';

export const handler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.log(':::ERROR:::', error);
      const message = (error as { message?: string })?.message || 'Internal server error';
      // error might be JSON string, try to parse it
      try {
        const errorObject = JSON.parse(message);
        res.status(400).json({ error: true, ...errorObject });
      } catch {
        // if it fails, return the error as is
        res.status(500).json({ error: true, message });
      }
    }
  };
};
