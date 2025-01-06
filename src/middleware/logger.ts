import { type Request } from 'express';
import winston from 'winston';
import LokiTransport from 'winston-loki';
import { trace, context } from '@opentelemetry/api';

const lokiHost = process.env.LOKI_HOST || 'http://localhost:3200';

const traceFormat = winston.format((info) => {
  const span = trace.getSpan(context.active());
  if (span) {
    const context = span.spanContext();
    info.traceId = context.traceId;
    info.spanId = context.spanId;
  }
  return info;
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(traceFormat(), winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'api-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new LokiTransport({
      host: lokiHost,
      labels: { job: 'api-logs' },
      json: true,
      format: winston.format.combine(traceFormat(), winston.format.json()),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error(err),
    }),
  ],
});

export const addRequestContext = (info: any, req: Request) => {
  const span = trace.getSpan(context.active());
  if (span) {
    const ctx = span.spanContext();
    return {
      ...info,
      traceId: ctx.traceId,
      spanId: ctx.spanId,
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('user-agent'),
    };
  }
  return info;
};

export const getTraceId = () => {
  const span = trace.getSpan(context.active());
  if (span) {
    const ctx = span.spanContext();
    return ctx.traceId;
  }
  return null;
};

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}
