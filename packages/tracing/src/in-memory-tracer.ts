import { SpanAttributes, SpanAttributeValue } from "@opentelemetry/api";

import { Span as FwlSpan, Tracer } from "./tracer";

interface Span extends FwlSpan {
  id: string;
  name: string;
  attributes: SpanAttributes;
  parent?: InMemorySpan;
}

class InMemorySpan implements Span {
  private tracer: InMemoryTracer;
  public id: string;
  public name: string;
  public parent?: InMemorySpan;
  public attributes: SpanAttributes;

  constructor(
    id: string,
    name: string,
    tracer: InMemoryTracer,
    parent?: InMemorySpan,
  ) {
    this.id = id;
    this.tracer = tracer;
    this.name = name;
    this.attributes = {};
    this.parent = parent;
  }

  end(): void {
    this.tracer._saveSpan(this);
  }

  getTraceId(): string {
    return this.parent ? this.parent.getTraceId() : this.id;
  }

  setAttribute(key: string, _value: SpanAttributeValue): this {
    this.attributes[key] = "[REDACTED]";
    return this;
  }

  setDisclosedAttribute(key: string, value: SpanAttributeValue): this {
    this.attributes[key] = value;
    return this;
  }
}

type SpanCallback<T> = (span: InMemorySpan) => Promise<T>;

class InMemoryTracer implements Tracer {
  public spans: InMemorySpan[];
  private rootSpan?: InMemorySpan;
  private currentSpan?: InMemorySpan;
  private currentSpanId = 0;

  constructor() {
    this.spans = [];
  }

  async withSpan<T>(
    name: string,
    callback: (span: Span) => Promise<T>,
  ): Promise<T> {
    const span = this.createSpan(name);
    this.rootSpan = span;
    const result = await callback(span);
    span.end();
    this.rootSpan = undefined;
    return result;
  }

  createSpan(name: string): InMemorySpan {
    this.currentSpanId++;

    const span = new InMemorySpan(
      this.currentSpanId.toString(),
      name,
      this,
      this.currentSpan,
    );

    this.currentSpan = span;

    return span;
  }

  getCurrentSpan(): Span | undefined {
    return this.rootSpan;
  }

  span<T>(name: string, callback: SpanCallback<T>): Promise<T> {
    this.currentSpanId++;

    const span = new InMemorySpan(
      this.currentSpanId.toString(),
      name,
      this,
      this.currentSpan,
    );

    this.currentSpan = span;

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

  _saveSpan(span: InMemorySpan): void {
    this.spans.unshift(span);

    if (span.parent) {
      this.currentSpan = span.parent;
    }
  }

  searchSpanByName(name: string): InMemorySpan[] {
    return this.spans.filter((span) => span.name === name);
  }
}

export { InMemoryTracer };
