import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PostgresError } from 'postgres';

import { sharedResponses } from './response-helper';
import { CustomError } from './custom-error';

export const handler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sharedResponses.BAD_REQUEST(
          res,
          error.errors.map((err) => err.message)
        );
      } else if (error instanceof PostgresError) {
        // log
        console.log('Failed to operate on database', error.detail);
      } else if (error instanceof CustomError) {
        const message = error.message;

        return sharedResponses.BAD_REQUEST(res, [message]);
      }

      return sharedResponses.INTERNAL_SERVER_ERROR(res);
    }
  };
};

export function validateBody<T extends z.ZodSchema>(schema: T, body: unknown): z.infer<T> {
  return schema.parse(body);
}

export function validateParams<T extends z.ZodSchema>(schema: T, params: unknown): z.infer<T> {
  return schema.parse(params);
}
