import * as types from "@opentelemetry/api";

interface Span {
  id: number;
  name: string;
  attributes: types.Attributes;
  parent: undefined | number;
}

class InMemorySpan {
  private tracer: InMemoryTracer;
  public id: number;
  public name: string;
  public parent: InMemorySpan | undefined;
  public attributes: types.Attributes;

  constructor(
    id: number,
    name: string,
    tracer: InMemoryTracer,
    parent: InMemorySpan | undefined,
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

  context(): types.SpanContext {
    return {
      isRemote: undefined,
      spanId: this.id.toString(),
      traceFlags: 0,
      traceId: "",
      traceState: {
        get: () => undefined,
        set: () => {},
        serialize: () => "",
        unset: () => {},
      },
    };
  }

  setAttribute(key: string, value: unknown): this {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: types.Attributes): this {
    this.attributes = { ...this.attributes, ...attributes };
    return this;
  }

  addEvent(): this {
    return this;
  }

  setStatus(): this {
    return this;
  }

  updateName(name: string): this {
    this.name = name;
    return this;
  }

  isRecording(): boolean {
    return true;
  }
}

type SpanCallback<T> = (span: InMemorySpan) => Promise<T>;

export class InMemoryTracer {
  public spans: Span[];
  private currentSpan: InMemorySpan | undefined;
  private currentSpanId = 0;

  constructor() {
    this.spans = [];
  }

  createSpan(name: string): InMemorySpan {
    this.currentSpanId++;

    const span = new InMemorySpan(
      this.currentSpanId,
      name,
      this,
      this.currentSpan,
    );

    this.currentSpan = span;

    return span;
  }

  span<T>(name: string, callback: SpanCallback<T>): Promise<T> {
    this.currentSpanId++;

    const span = new InMemorySpan(
      this.currentSpanId,
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
    this.spans.unshift({
      id: span.id,
      name: span.name,
      attributes: span.attributes,
      parent: span.parent ? span.parent.id : undefined,
    });

    if (span.parent) {
      this.currentSpan = span.parent;
    }
  }

  searchSpanByName(name: string): Span[] {
    return this.spans.filter((span) => span.name === name);
  }
}
