import { trace, context } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';

export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const activeSpan = trace.getActiveSpan();

  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    req.id = spanContext.traceId;
    res.setHeader('X-Trace-Id', spanContext.traceId);
  }
  next();
};
