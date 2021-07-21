import { Logger } from "@fwl/logging";
import {
  context,
  Span as OpenTelemetrySpan,
  Tracer as OpenTelemetryTracer,
  TimeInput,
  SpanAttributeValue,
  trace,
} from "@opentelemetry/api";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import {
  CollectorTraceExporter,
  CollectorExporterNodeConfigBase,
} from "@opentelemetry/exporter-collector";
import { NodeTracerProvider } from "@opentelemetry/node";
import { Resource } from "@opentelemetry/resources";
import { ResourceAttributes } from "@opentelemetry/semantic-conventions";
import { SimpleSpanProcessor } from "@opentelemetry/tracing";

import type { TracingConfig } from "./config";

let provider: NodeTracerProvider;

let isTracerStarted = false;

function startTracer(options: TracingConfig, logger?: Logger): void {
  if (isTracerStarted) {
    return;
  }

  if (options.collectors) {
    provider = new NodeTracerProvider({
      resource: new Resource({
        [ResourceAttributes.SERVICE_NAME]: options.collectors[0].serviceName,
      }),
    });
    for (const collector of options.collectors) {
      if (collector.type === "otel") {
        const collectorOptions: CollectorExporterNodeConfigBase = {
          attributes: options.attributes,
          url: collector.url,
        };
        if (collector.authorizationHeader) {
          const { key, value } = collector.authorizationHeader;
          collectorOptions.headers = {
            [key]: value,
          };
        }
        const exporter = new CollectorTraceExporter(collectorOptions);

        const spanProcessor = new SimpleSpanProcessor(exporter);
        provider.addSpanProcessor(spanProcessor);
      }
    }
  }

  if (options.simpleCollector) {
    provider = new NodeTracerProvider({
      resource: new Resource({
        [ResourceAttributes.SERVICE_NAME]: options.simpleCollector.serviceName,
      }),
    });

    const collector = new CollectorTraceExporter({
      attributes: options.attributes,
      url: options.simpleCollector.url,
    });

    const spanProcessor = new SimpleSpanProcessor(collector);
    provider.addSpanProcessor(spanProcessor);
  }

  if (options.lightstepPublicSatelliteCollector) {
    provider = new NodeTracerProvider({
      resource: new Resource({
        [ResourceAttributes.SERVICE_NAME]:
          options.lightstepPublicSatelliteCollector.serviceName,
      }),
    });

    const collector = new CollectorTraceExporter({
      attributes: options.attributes,
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
    return context.with(trace.setSpan(context.active(), span), async () => {
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
    const span = trace.getSpan(context.active());
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

  const getTraceId = (): string => otSpan.spanContext().traceId;

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
