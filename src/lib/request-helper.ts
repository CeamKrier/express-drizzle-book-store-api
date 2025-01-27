import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PostgresError } from 'postgres';

import { logger } from '@/logger';

import { sharedResponses } from './response-helper';
import { CustomError } from './custom-error';

export const handler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Request received', { path: getFullRoutePath(req) });
      await fn(req, res, next);
      logger.info('Request processed');
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error', {
          error: {
            errors: error.errors,
          },
        });

        return sharedResponses.BAD_REQUEST(
          res,
          error.errors.map((err) => err.message)
        );
      } else if (error instanceof PostgresError) {
        logger.error('Database error', {
          error: {
            detail: error.detail,

            code: error.code,
          },
        });
      } else if (error instanceof CustomError) {
        logger.error('Custom error', {
          error: {
            message: error.message,
          },
        });

        const message = error.message;

        return sharedResponses.BAD_REQUEST(res, [message]);
      }

      logger.error('Unexpected error', {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return sharedResponses.INTERNAL_SERVER_ERROR(res);
    }
  };
};

export function validateBody<T extends z.ZodSchema>(schema: T, body: unknown): z.infer<T> {
  logger.info('Validating request body', { data: body });
  return schema.parse(body);
}

export function validateParams<T extends z.ZodSchema>(schema: T, params: unknown): z.infer<T> {
  logger.info('Validating request params', { data: params });
  return schema.parse(params);
}

export function getFullRoutePath(req: Request): string {
  // Get the base components
  const baseUrl = req.baseUrl || '';
  const route = req.route?.path || '';

  // If no route is found, return the path or baseUrl
  if (!route) {
    return req.path || baseUrl || '(unknown route)';
  }

  // Helper function to normalize parameters in route segments
  function normalizeParams(routeSegment: string): string {
    // Split the path into segments
    const normalized = routeSegment
      .split('/')
      .map((segment) => {
        // For each actual value in params, replace it with its parameter name

        for (const [paramName, paramValue] of Object.entries(req.params)) {
          if (segment === paramValue) {
            return `:${paramName}`;
          }
        }
        return segment;
      })
      .join('/');

    if (normalized.endsWith('/')) {
      return normalized.slice(0, -1);
    }

    return normalized;
  }

  // Combine and normalize the full path
  let fullPath = `${baseUrl}${route}`;

  // Normalize path separators
  fullPath = fullPath.replace(/\/+/g, '/');

  // If path doesn't start with '/', add it
  if (!fullPath.startsWith('/')) {
    fullPath = '/' + fullPath;
  }

  // Normalize all parameters in the path
  return normalizeParams(fullPath);
}
