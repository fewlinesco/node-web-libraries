import { Span as OpenTelemetrySpan, TimeInput } from "@opentelemetry/api";
import { LogLevel } from "@opentelemetry/core";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { NodeTracerProvider } from "@opentelemetry/node";
import { SimpleSpanProcessor } from "@opentelemetry/tracing";

import { TracingConfig } from "./config/config";

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
      return spanFactory(provider.getTracer("default").startSpan(name));
    },
    span: <T>(name: string, callback: SpanCallback<T>): Promise<T> => {
      const span = spanFactory(provider.getTracer("default").startSpan(name));
      return callback(span).finally(() => span.end());
    },
  };
}

function spanFactory(otSpan: OpenTelemetrySpan): Span {
  const setAttribute = (key: string, _value: unknown): Span => {
    otSpan.setAttribute(key, "[REDACTED]");
    return this;
  };
  const setDisclosedAttribute = (key: string, value: unknown): Span => {
    otSpan.setAttribute(key, value);
    return this;
  };

  return {
    setAttribute,
    setDisclosedAttribute,
    end: otSpan.end,
  };
}

export interface Span {
  setAttribute(key: string, value: unknown): this;
  setDisclosedAttribute(key: string, value: unknown): this;
  end(endTime?: TimeInput): void;
}
