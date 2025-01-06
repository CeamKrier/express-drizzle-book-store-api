import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PostgresError } from 'postgres';

import { logger } from '@/middleware/logger';

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
        logger.warn('Validation error', {
          errors: error.errors,
          path: req.path,
        });
        return sharedResponses.BAD_REQUEST(
          res,
          error.errors.map((err) => err.message)
        );
      } else if (error instanceof PostgresError) {
        logger.error('Database error', {
          detail: error.detail,
          path: req.path,
          code: error.code,
        });
      } else if (error instanceof CustomError) {
        logger.warn('Custom error', {
          message: error.message,
          path: req.path,
        });

        const message = error.message;

        return sharedResponses.BAD_REQUEST(res, [message]);
      }

      logger.error('Unexpected error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
      });

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
