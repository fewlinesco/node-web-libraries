import { Span } from "@opentelemetry/api";
import { LogLevel } from "@opentelemetry/core";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { NodeTracerProvider } from "@opentelemetry/node";
import { SimpleSpanProcessor } from "@opentelemetry/tracing";

import { TracingConfig } from "./config/config";

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
  },
});

export function startTracer(options: TracingConfig): void {
  provider.addSpanProcessor(
    new SimpleSpanProcessor(
      new ZipkinExporter({
        serviceName: options.serviceName,
        url: options.url,
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
