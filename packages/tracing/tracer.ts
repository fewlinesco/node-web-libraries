import { Span } from "@opentelemetry/api";
import { LogLevel } from "@opentelemetry/core";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { NodeTracerProvider } from "@opentelemetry/node";
import { SimpleSpanProcessor } from "@opentelemetry/tracing";

export { Span } from "@opentelemetry/api";

const provider: NodeTracerProvider = new NodeTracerProvider({
  logLevel: LogLevel.INFO,
  plugins: {
    express: {
      enabled: true,
      path: "@opentelemetry/plugin-express",
    },
    http: {
      enabled: true,
      path: "@opentelemetry/plugin-http",
    },
    https: {
      enabled: true,
      path: "@opentelemetry/plugin-https",
    },
    pg: {
      enabled: true,
      path: "@opentelemetry/plugin-pg",
    },
    "pg-pool": {
      enabled: true,
      path: "@opentelemetry/plugin-pg-pool",
    },
  },
});

interface TracingOptions {
  url?: string;
  serviceName: string;
}

export function startTracer(options: TracingOptions): void {
  provider.addSpanProcessor(
    new SimpleSpanProcessor(
      new ZipkinExporter({
        serviceName: options.serviceName,
      }),
    ),
  );

  provider.register();

  console.log("tracing initialized");
}

type SpanCallback<T> = (span: Span) => Promise<T>;

export interface Tracer {
  createSpan: (name: string) => Span;
  span: <T>(name: string, callback: SpanCallback<T>) => Promise<T>;
}

export function getTracer(): Tracer {
  return {
    createSpan: (name: string): Span => {
      return provider.getTracer("default").startSpan(name);
    },
    span: <T>(name: string, callback: SpanCallback<T>): Promise<T> => {
      const span = provider.getTracer("default").startSpan(name);
      return callback(span).finally(() => span.end());
    },
  };
}
