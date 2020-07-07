import * as types from "@opentelemetry/api";

interface Span extends types.Span {
  id: number;
  name: string;
  attributes: types.Attributes;
  parent?: InMemorySpan;
}

class InMemorySpan implements Span {
  private tracer: InMemoryTracer;
  public id: number;
  public name: string;
  public parent?: InMemorySpan;
  public attributes: types.Attributes;

  constructor(
    id: number,
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

  context(): types.SpanContext {
    const traceState: types.TraceState = {
      get: () => undefined,
      set: () => {
        return;
      },
      serialize: () => "",
      unset: () => {
        return;
      },
    };

    return {
      isRemote: undefined,
      spanId: this.id.toString(),
      traceFlags: 0,
      traceId: "",
      traceState,
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
  public spans: InMemorySpan[];
  private currentSpan?: InMemorySpan;
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
    const currentInMemorySpan = new InMemorySpan(
      span.id,
      span.name,
      this,
      span?.parent,
    );

    currentInMemorySpan.setAttributes(span.attributes);

    this.spans.unshift(currentInMemorySpan);

    if (span.parent) {
      this.currentSpan = span.parent;
    }
  }

  searchSpanByName(name: string): InMemorySpan[] {
    return this.spans.filter((span) => span.name === name);
  }
}
