import { Logger } from "@fwl/logging";
import type {
  Span as OpenTelemetrySpan,
  Tracer as OpenTelemetryTracer,
  TimeInput,
  AttributeValue,
  SpanOptions,
  Attributes,
} from "@opentelemetry/api";
import { SpanKind } from "@opentelemetry/api";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { LogLevel } from "@opentelemetry/core";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { NodeTracerProvider } from "@opentelemetry/node";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/tracing";

import type { TracingConfig } from "./config/config";

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

export function startTracer(options: TracingConfig, logger?: Logger): void {
  if (isTracerStarted) {
    return;
  }
  const collector = new ZipkinExporter({
    serviceName: options.serviceName,
    url: options.url,
  });

  const spanProcessor = new SimpleSpanProcessor(collector);

  provider.addSpanProcessor(spanProcessor);

  const contextManager = new AsyncHooksContextManager();
  contextManager.enable();

  provider.register({ contextManager });

  isTracerStarted = true;

  if (logger) {
    logger.log("tracing initialized", {
      tracingServiceName: options.serviceName,
      tracingUrl: options.url,
    });
  }
}

type SpanCallback<T> = (span: Span) => Promise<T>;

export interface Tracer {
  createRootSpan: (name: string) => Span;
  createSpan: (name: string) => Span;
  span: <T>(name: string, callback: SpanCallback<T>) => Promise<T>;
}

class TracerImpl implements Tracer {
  private static instance: Tracer;
  private tracer: OpenTelemetryTracer;
  private constructor() {
    this.tracer = provider.getTracer("default");
  }
  private rootSpan?: OpenTelemetrySpan;

  static getInstance(): Tracer {
    if (!TracerImpl.instance) {
      TracerImpl.instance = new TracerImpl();
    }

    return TracerImpl.instance;
  }

  createRootSpan(name: string): Span {
    const spanOptions: SpanOptions = {
      kind: SpanKind.SERVER,
    };
    const span = this.tracer.startSpan(name, spanOptions);
    this.rootSpan = span;

    return spanFactory(span);
  }

  createSpan(name: string): Span {
    if (this.rootSpan) {
      return this.tracer.withSpan(this.rootSpan, () => {
        const span = spanFactory(this.tracer.startSpan(name));
        return span;
      });
    } else {
      const span = spanFactory(this.tracer.startSpan(name));
      return span;
    }
  }

  span<T>(name: string, callback: SpanCallback<T>): Promise<T> {
    if (this.rootSpan) {
      return this.tracer.withSpan(this.rootSpan, () => {
        const span = spanFactory(this.tracer.startSpan(name));
        return callback(span).finally(() => {
          span.end();
        });
      });
    } else {
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
}

export function getTracer(): Tracer {
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

export interface Span {
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
