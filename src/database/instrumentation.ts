import { trace, Span, SpanStatusCode, context } from '@opentelemetry/api';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

registerInstrumentations({
  instrumentations: [
    new PgInstrumentation({
      enhancedDatabaseReporting: true,
      responseHook: (span, response) => {
        span.setAttribute('db.rows_affected', response.data.rowCount);
      },
    }),
  ],
});

export function withQueryTracing<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: any[]) => {
    const tracer = trace.getTracer('postgres');
    const parentContext = context.active();
    const span = tracer.startSpan('pg.query', undefined, parentContext);

    try {
      const result = await fn(...args);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown database error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }) as T;
}
