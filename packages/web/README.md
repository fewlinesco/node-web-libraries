# FWL Web

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides a framework on top of `http` to be used with Express and Next.JS.

## Installation

```shell
yarn add @fwl/web
```

## Usage

### Definitions

For the purpose of this package, here are the definitions we will use:

- **path**: a string, the path for which a _handler_ will be invoked.
- **handler**: a function that will be invoked for a request. It takes a request and a response as input and returns anything.
- **route**: the combination of a _path_, a _handler_ and an HTTP method (e.g: the _handler_ that will respond to `GET /resource`)
- **router**: a collection of _routes_
- **endpoint**: the combination of _handlers_ that will respond for a given request for all HTTP methods (a sort of _route_ for all methods).

### Handler

At its simplest, a handler would look like that:

```typescript
import { IncomingMessage, ServerResponse } from "http";
import { HttpStatus } from "@fwl/web";

export function pingHandler(
  request: IncomingMessage,
  response: ServerResponse
): void {
  response.statusCode = HttpStatus.OK;
  response.end("OK");
}
```

However, we recommend to use tracing, for easier debugging and it should look like this:

```typescript
import { IncomingMessage, ServerResponse } from "http";
import { Tracer } from "@fwl/tracing";
import { HttpStatus } from "@fwl/web";

export function pingHandler(tracer: Tracer) {
  return (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    return tracer.span("ping-handler", async () => {
      response.statusCode = HttpStatus.OK;
      response.end("OK");
    });
  };
}
```

This is basic dependency injection via a function.
We're exporting a function that takes a dependency (`tracer`) that returns a Handler.
You could then use it with a Router `router.get("/ping", pingHandler(tracer))` or with an Endpoint `new Endpoint().get(pingHandler(tracer))`.

### Router

A Router is a class that takes a list of middlewares for its constructor.
You can then add routes to it by giving it a path and a handler

```typescript
import { Router } from "@fwl/web";

const router = new Router([
  withLogging(tracer, logger),
  errorMiddleware(tracer),
]);

router.get("/ping", pingHandler(tracer));
router.get("/users/:id", userHandler.getUserById(tracer));
router.post("/users", userHandler.createUser(tracer));
```

If you need to add a middleware to one route in particular, you can use:

```typescript
import { Router } from "@fwl/web";
import { wrapMiddlewares } from "@fwl/web/dist/middlewares";

const router = new Router([
  withLogging(tracer, logger),
  errorMiddleware(tracer),
]);

router.get("/ping", pingHandler(tracer));
router.get("/users/:id", userHandler.getUserById(tracer));
router.post("/users", userHandler.createUser(tracer));
```

### Endpoint

### Dealing With Errors

### Middlewares

### Usage for Express

### Usage for Next.Js
