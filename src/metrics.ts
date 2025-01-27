import promClient from 'prom-client';
import { type Application } from 'express';

import { metricsMiddleware } from '@/middleware/metrics';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// HTTP request counter
export const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'route', 'status'],
});

// Response time histogram
export const responseTimeHistogram = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Ongoing requests gauge
export const ongoingRequests = new promClient.Gauge({
  name: 'http_requests_in_progress',
  help: 'The count of HTTP requests that are currently in process',
  labelNames: ['path', 'route', 'method'],
});

// Response duration summary
export const responseDuration = new promClient.Summary({
  name: 'http_response_latency_ms',
  help: 'The duration of responses in milliseconds',
  labelNames: ['path', 'route', 'method'],
});

// Error counter
export const errorCount = new promClient.Counter({
  name: 'http_errors_total',
  help: 'The overall number of HTTP errors',
  labelNames: ['path', 'method', 'route', 'statuscode'],
});

// Response duration histogram with exponential buckets
export const responseDurationHistogram = new promClient.Histogram({
  name: 'http_response_latency_histogram',
  help: 'The duration of responses in milliseconds',
  buckets: promClient.exponentialBuckets(0.05, 1.75, 8),
  labelNames: ['path', 'route', 'method'],
});

register.registerMetric(httpRequestCounter);
register.registerMetric(responseTimeHistogram);
register.registerMetric(ongoingRequests);
register.registerMetric(responseDuration);
register.registerMetric(errorCount);
register.registerMetric(responseDurationHistogram);

export const registerMetrics = (app: Application) => {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  app.use(metricsMiddleware);
};
