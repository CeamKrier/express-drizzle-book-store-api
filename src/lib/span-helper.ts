import { trace, SpanStatusCode, context, Span } from '@opentelemetry/api';

export function withSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  const tracer = trace.getTracer('bookshelf-api');

  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function addCommonAttributes(
  span: Span,
  attributes: Record<string, string | number | boolean>
) {
  span.setAttributes({
    'service.name': 'bookshelf-api',
    'deployment.environment': process.env.NODE_ENV || 'development',
    ...attributes,
  });
}
