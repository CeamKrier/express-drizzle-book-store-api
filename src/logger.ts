import winston from 'winston';
import LokiTransport from 'winston-loki';

if (!process.env.LOKI_HOST) {
  throw new Error('LOKI_HOST environment variable is required');
}

const logFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

const lokiTransport = new LokiTransport({
  host: process.env.LOKI_HOST,
  labels: { service: process.env.SERVICE_IDENTIFIER },
  json: true,
  format: logFormat,
  replaceTimestamp: true,
  onConnectionError: (err) => console.error(err),
});

export const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: process.env.SERVICE_IDENTIFIER },
  transports: [lokiTransport],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}
