# FWL Tracing

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.
It provides a simple way to do tracing with [OpenTelemetry](https://opentelemetry.io).

## Installation

```shell
yarn add @fwl/tracing
```

## Getting Started

As OpenTelemetry libraries need to monkey patch packages before them being called, starting the tracer should be the first thing you do.

Here's an example with a simple collector (e.g. Zipkin):

```typescript
import { getTracer, startTracer } from "@fwl/tracing";

startTracer({
  simpleCollector: {
    serviceName: "serviceName",
    url: "http://localhost:9411/api/v2/spans",
  },
});

const tracer = getTracer();
```

And an example with a Lightstep public satellite:

```typescript
import { getTracer, startTracer } from "@fwl/tracing";

startTracer({
  lightstepPublicSatelliteCollector: {
    serviceName: "serviceName",
    accessToken: process.env.LIGHTSTEP_ACCESS_TOKEN,
  },
});

const tracer = getTracer();
```

If you want to use Lightstep in developer mode, you could add an URL:

```typescript
startTracer({
  lightstepPublicSatelliteCollector: {
    serviceName: "serviceName",
    accessToken: "",
    url: "http://localhost:8360/api/v2/otel/trace",
  },
});
```

## Usage

Once you have a tracer (of type `Tracer`), you will have a `span` method:

```typescript
import { Span, Tracer } from "@fwl/tracing";

// ...
function(tracer: Tracer) {
  tracer.span("span name", async (span: Span) => {
    // If you want to add attributes to your span with a visible value
    span.setDisclosedAttribute(key, value);

    // If you want to add attributes to your span with a redacted value
    span.setAttribute(key, value);

    // any code there that return a Promise (in this example, the callback is an `async` function so any value should do
  });
}
```

This way is the recommended way as it will automatically end the span for you.
However, if you ever are in need to more fine grain control (for instance, in a middleware), you can use `createSpan`:

Here is an example of a logging middleware for Express:

```typescript
import { NextFunction, Request, Response } from "express";
import { Logger } from "@fwl/logging";
import { Tracer, Span } from "@fwl/tracing";

export function loggingMiddleware(tracer: Tracer, logger: Logger) {
  function onCloseOrFinish(span: Span, startTime: bigint): () => void {
    return function () {
      const response = this as Response;
      response.removeListener("finish", onCloseOrFinish);
      const end = process.hrtime.bigint();
      logger.log(
        `${response.req.path}: ${response.statusCode} in ${end - startTime}`
      );
      span.end();
    };
  }
  return function (
    _request: Request,
    response: Response,
    next: NextFunction
  ): void {
    const startTime = process.hrtime.bigint();
    const span = tracer.createSpan("logging middleware");
    response.once("finish", onCloseOrFinish(span, startTime));
    next();
  };
}
```

Keep in mind that this method is only required because we need to call `next()` and we want to start the span across the whole request.
The recommended method is to use `tracer.span`.

## Tracing during tests

If you need to use the tracer in a testing environment, we provide a `InMemoryTracer` class that act as a regular tracer, except you won't have to launch `jaeger` to run your tests.`InMemoryTracer` also provides you with a way of testing your spans with the use of the `searchSpanByName`. The usage is the same, you just need to initialize `InMemoryTracer` instead of using `startTracer()`.

Here is an example of use in a test file using `jest`:

```ts
import { InMemoryTracer } from "@fwl/tracing";

let tracer: InMemoryTracer;

beforeEach(() => {
  tracer = new InMemoryTracer();
});

test("verify span attributes", () => {
  expect.assertions(1);

  // Call the code that is using a tracer.

  const [span] = tracer.searchSpanByName("test-span");

  expect(span.attributes[0].attributeName).toBe("attribute value");
});
```
