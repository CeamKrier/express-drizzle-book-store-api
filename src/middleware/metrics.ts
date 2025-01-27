import { type Request, type Response, type NextFunction } from 'express';

import { getFullRoutePath } from '@/lib/request-helper';
import {
  errorCount,
  httpRequestCounter,
  ongoingRequests,
  responseDuration,
  responseDurationHistogram,
  responseTimeHistogram,
} from '@/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  const actualPath = req.originalUrl;

  process.nextTick(() => {
    const normalizedPath = getFullRoutePath(req);
    ongoingRequests.inc({ path: actualPath, route: normalizedPath, method: req.method });
  });

  res.on('finish', () => {
    const normalizedPath = getFullRoutePath(req);
    ongoingRequests.dec({ path: actualPath, route: normalizedPath, method: req.method });

    const duration = process.hrtime(start);
    const durationMs = (duration[0] * 1e9 + duration[1]) / 1e6;

    // Record duration metrics
    responseDuration.observe(
      { path: actualPath, route: normalizedPath, method: req.method },
      durationMs
    );
    responseDurationHistogram.observe(
      { path: actualPath, route: normalizedPath, method: req.method },
      durationMs
    );

    // Track errors
    if (res.statusCode >= 400) {
      errorCount.inc({
        path: actualPath,
        route: normalizedPath,
        method: req.method,
        statuscode: res.statusCode,
      });
    }

    // Increment the request counter
    httpRequestCounter.inc({
      method: req.method,
      path: actualPath,
      route: normalizedPath,
      status: res.statusCode,
    });

    // Observe the request duration
    responseTimeHistogram.observe(
      {
        method: req.method,
        path: actualPath,
        route: normalizedPath,
        status: res.statusCode,
      },
      durationMs / 1000
    );
  });

  next();
};
