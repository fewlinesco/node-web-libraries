import { Logger } from "@fwl/logging";
import {
  context,
  Span as OpenTelemetrySpan,
  Tracer as OpenTelemetryTracer,
  TimeInput,
  SpanAttributeValue,
  getSpan,
  setSpan,
} from "@opentelemetry/api";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { CollectorTraceExporter } from "@opentelemetry/exporter-collector";
// import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { NodeTracerProvider } from "@opentelemetry/node";
import {
  // BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/tracing";

import type { TracingConfig } from "./config";

const provider = new NodeTracerProvider();

// const provider = new BasicTracerProvider();
// registerInstrumentations({
//   logLevel: DiagLogLevel.INFO,
//   plugins: {
//     express: { enabled: false },
//     pg: { enabled: false },
//     "pg-pool": { enabled: false },
//     http: {
//       enabled: true,
//       path: "@opentelemetry/plugin-http",
//     },
//     https: {
//       enabled: true,
//       path: "@opentelemetry/plugin-https",
//     },
//   },
// });

let isTracerStarted = false;

function startTracer(options: TracingConfig, logger?: Logger): void {
  if (isTracerStarted) {
    return;
  }
  if (options.simpleCollector) {
    const collector = new CollectorTraceExporter({
      attributes: options.attributes,
      serviceName: options.simpleCollector.serviceName,
      url: options.simpleCollector.url,
    });

    const spanProcessor = new SimpleSpanProcessor(collector);

    provider.addSpanProcessor(spanProcessor);
  }
  if (options.lightstepPublicSatelliteCollector) {
    const collector = new CollectorTraceExporter({
      attributes: options.attributes,
      serviceName: options.lightstepPublicSatelliteCollector.serviceName,
      headers: {
        "Lightstep-Access-Token":
          options.lightstepPublicSatelliteCollector.accessToken,
      },
      url:
        options.lightstepPublicSatelliteCollector.url ||
        "https://ingest.lightstep.com:443/api/v2/otel/trace",
    });

    provider.addSpanProcessor(new SimpleSpanProcessor(collector));
  }

  const contextManager = new AsyncHooksContextManager();
  contextManager.enable();

  provider.register({ contextManager });

  isTracerStarted = true;

  if (logger && options.simpleCollector) {
    logger.log("tracing initialized", {
      tracingServiceName: options.simpleCollector.serviceName,
      tracingUrl: options.simpleCollector.url,
    });
  }
  if (logger && options.lightstepPublicSatelliteCollector) {
    logger.log("Lightstep tracing initialized", {
      tracingServiceName: options.lightstepPublicSatelliteCollector.serviceName,
    });
  }
}

type SpanCallback<T> = (span: Span) => Promise<T>;

interface Tracer {
  createSpan: (name: string) => Span;
  getCurrentSpan: () => Span | undefined;
  span: <T>(name: string, callback: SpanCallback<T>) => Promise<T>;
  withSpan: <T>(name: string, callback: SpanCallback<T>) => Promise<T>;
}

class TracerImpl implements Tracer {
  private static instance: Tracer;
  private tracer: OpenTelemetryTracer;
  private constructor() {
    this.tracer = provider.getTracer("default");
  }

  static getInstance(): Tracer {
    if (!TracerImpl.instance) {
      TracerImpl.instance = new TracerImpl();
    }

    return TracerImpl.instance;
  }

  withSpan<T>(name: string, callback: SpanCallback<T>): Promise<T> {
    const span = this.tracer.startSpan(name);
    return context.with(setSpan(context.active(), span), async () => {
      try {
        const result = await callback(spanFactory(span));
        span.end();
        return result;
      } catch (error) {
        span.end();
        throw error;
      }
    });
  }

  getCurrentSpan(): Span | undefined {
    const span = getSpan(context.active());
    if (span) {
      return spanFactory(span);
    }
    return undefined;
  }

  createSpan(name: string): Span {
    return spanFactory(this.tracer.startSpan(name));
  }

  span<T>(name: string, callback: SpanCallback<T>): Promise<T> {
    const span = spanFactory(this.tracer.startSpan(name));
    return callback(span).then(
      (result) => {
        span.end();
        return result;
      },
      (error) => {
        span.end();
        throw error;
      },
    );
  }
}

function getTracer(): Tracer {
  return TracerImpl.getInstance();
}

function spanFactory(otSpan: OpenTelemetrySpan): Span {
  const setAttribute = (key: string, _value: unknown): Span => {
    otSpan.setAttribute(key, "[REDACTED]");
    return this;
  };
  const setDisclosedAttribute = (
    key: string,
    value: SpanAttributeValue,
  ): Span => {
    otSpan.setAttribute(key, value);
    return this;
  };

  const getTraceId = (): string => otSpan.context().traceId;

  const end = otSpan.end.bind(otSpan);

  return {
    getTraceId,
    setAttribute,
    setDisclosedAttribute,
    end,
  };
}

interface Span {
  getTraceId(): string;
  setAttribute(key: string, value: unknown): this;
  setDisclosedAttribute(key: string, value: unknown): this;
  end(endTime?: TimeInput): void;
}

export { getTracer, startTracer, Span, Tracer };
