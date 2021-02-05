import { Logger } from "@fwl/logging";
import type {
  Span as OpenTelemetrySpan,
  Tracer as OpenTelemetryTracer,
  TimeInput,
  AttributeValue,
  Attributes,
} from "@opentelemetry/api";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { LogLevel } from "@opentelemetry/core";
import { CollectorTraceExporter } from "@opentelemetry/exporter-collector";
import { NodeTracerProvider } from "@opentelemetry/node";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/tracing";

import type { TracingConfig } from "./config";

const provider: BasicTracerProvider = new NodeTracerProvider({
  logLevel: LogLevel.INFO,
  plugins: {
    express: { enabled: false },
    pg: { enabled: false },
    "pg-pool": { enabled: false },
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

let isTracerStarted = false;

function startTracer(options: TracingConfig, logger?: Logger): void {
  if (isTracerStarted) {
    return;
  }
  if (options.simpleCollector) {
    const collector = new CollectorTraceExporter({
      logger: logger && {
        debug: logger.log,
        error: logger.log,
        warn: logger.log,
        info: logger.log,
      },
      attributes: options.attributes,
      serviceName: options.simpleCollector.serviceName,
      url: options.simpleCollector.url,
    });

    const spanProcessor = new SimpleSpanProcessor(collector);

    provider.addSpanProcessor(spanProcessor);
  }
  if (options.lightstepPublicSatelliteCollector) {
    const collector = new CollectorTraceExporter({
      logger: logger && {
        debug: logger.log,
        error: logger.log,
        warn: logger.log,
        info: logger.log,
      },
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
  withSpan: (name: string, callback: SpanCallback<void>) => Promise<void>;
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

  withSpan(name, callback): Promise<void> {
    const span = this.tracer.startSpan(name);
    return this.tracer.withSpan(span, async () => {
      try {
        await callback(spanFactory(span));
        span.end();
      } catch (error) {
        span.end();
        throw error;
      }
    });
  }

  getCurrentSpan(): Span | undefined {
    const span = this.tracer.getCurrentSpan();
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
  const setDisclosedAttribute = (key: string, value: AttributeValue): Span => {
    otSpan.setAttribute(key, value);
    return this;
  };

  const getTraceId = (): string => otSpan.context().traceId;

  const addEvent = (
    name: string,
    attributesOrStartTime?: TimeInput | Attributes,
    startTime?: TimeInput,
  ): Span => {
    otSpan.addEvent(name, attributesOrStartTime, startTime);
    return this;
  };

  const end = otSpan.end.bind(otSpan);

  return {
    addEvent,
    getTraceId,
    setAttribute,
    setDisclosedAttribute,
    end,
  };
}

interface Span {
  addEvent(
    name: string,
    attributesOrStartTime?: TimeInput | Attributes,
    startTime?: TimeInput,
  ): Span;
  getTraceId(): string;
  setAttribute(key: string, value: unknown): this;
  setDisclosedAttribute(key: string, value: unknown): this;
  end(endTime?: TimeInput): void;
}

export { startTracer, Tracer, getTracer, Span };
