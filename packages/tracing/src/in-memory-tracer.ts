import * as types from "@opentelemetry/api";
import { Attributes, TimeInput } from "@opentelemetry/api";

import { Span as FwlSpan, Tracer } from "./tracer";

interface Span extends FwlSpan {
  id: string;
  name: string;
  attributes: types.Attributes;
  parent?: InMemorySpan;
}

class InMemorySpan implements Span {
  private tracer: InMemoryTracer;
  public id: string;
  public name: string;
  public parent?: InMemorySpan;
  public attributes: types.Attributes;
  public events: types.Event[];

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
    this.events = [];
    this.parent = parent;
  }

  addEvent(
    name: string,
    attributesOrStartTime?: TimeInput | Attributes,
    startTime?: TimeInput,
  ): this {
    const event: types.Event = { name, attributes: {} };
    if (startTime) {
      event.attributes.startTime = startTime.toString();
    } else if (
      typeof attributesOrStartTime === "number" ||
      attributesOrStartTime instanceof Date ||
      attributesOrStartTime instanceof Array
    ) {
      event.attributes.startTime = attributesOrStartTime.toString();
    } else if (attributesOrStartTime) {
      event.attributes = attributesOrStartTime;
    } else {
      event.attributes.startTime = new Date().toString();
    }

    this.events.push(event);
    return this;
  }

  end(): void {
    this.tracer._saveSpan(this);
  }

  getTraceId(): string {
    return this.parent ? this.parent.getTraceId() : this.id;
  }

  setAttribute(key: string, _value: types.AttributeValue): this {
    this.attributes[key] = "[REDACTED]";
    return this;
  }

  setDisclosedAttribute(key: string, value: types.AttributeValue): this {
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

  async withSpan(
    name: string,
    callback: (span: Span) => unknown,
  ): Promise<void> {
    const span = this.createSpan(name);
    this.rootSpan = span;
    await callback(span);
    span.end();
    this.rootSpan = undefined;
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
