import promClient from 'prom-client';
import { type Request, type Response, type NextFunction, type Application } from 'express';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

// Response time histogram
const responseTimeHistogram = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Ongoing requests gauge
const ongoingRequests = new promClient.Gauge({
  name: 'http_requests_in_progress',
  help: 'The count of HTTP requests that are currently in process',
  labelNames: ['path', 'method'],
});

// Response duration summary
const responseDuration = new promClient.Summary({
  name: 'http_response_latency_ms',
  help: 'The duration of responses in milliseconds',
  labelNames: ['path', 'method'],
});

// Error counter
const errorCount = new promClient.Counter({
  name: 'http_errors_total',
  help: 'The overall number of HTTP errors',
  labelNames: ['path', 'method', 'statuscode'],
});

// Response duration histogram with exponential buckets
const responseDurationHistogram = new promClient.Histogram({
  name: 'http_response_latency_histogram',
  help: 'The duration of responses in milliseconds',
  buckets: promClient.exponentialBuckets(0.05, 1.75, 8),
  labelNames: ['path', 'method'],
});

register.registerMetric(httpRequestCounter);
register.registerMetric(responseTimeHistogram);
register.registerMetric(ongoingRequests);
register.registerMetric(responseDuration);
register.registerMetric(errorCount);
register.registerMetric(responseDurationHistogram);

function getFullRoutePath(req: Request): string {
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
    return routeSegment
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
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  let normalizedPath: string;
  // Remove query parameters and normalize the path

  process.nextTick(() => {
    normalizedPath = getFullRoutePath(req);
    ongoingRequests.inc({ path: normalizedPath, method: req.method });
  });

  // Record the end of the request and calculate duration
  res.on('finish', () => {
    ongoingRequests.dec({ path: normalizedPath, method: req.method });

    const duration = process.hrtime(start);
    const durationMs = (duration[0] * 1e9 + duration[1]) / 1e6;

    // Record duration metrics
    responseDuration.observe({ path: normalizedPath, method: req.method }, durationMs);
    responseDurationHistogram.observe({ path: normalizedPath, method: req.method }, durationMs);

    // Track errors
    if (res.statusCode >= 400) {
      errorCount.inc({
        path: normalizedPath,
        method: req.method,
        statuscode: res.statusCode,
      });
    }

    // Increment the request counter
    httpRequestCounter.inc({
      method: req.method,
      path: normalizedPath,
      status: res.statusCode,
    });

    // Observe the request duration
    responseTimeHistogram.observe(
      {
        method: req.method,
        path: normalizedPath,
        status: res.statusCode,
      },
      durationMs / 1000
    );
  });

  next();
};

export const registerMetrics = (app: Application) => {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.send(await promClient.register.metrics());
  });
};
