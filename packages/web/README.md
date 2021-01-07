# FWL Web

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides a framework on top of `http` to be used with Express or Next.JS.

## Installation

```shell
yarn add @fwl/web
```

## Usage

### Definitions

For the purpose of this package, here are the definitions we will use:

- **path**: a string, the path for which a _handler_ will be invoked.
- **handler**: a function that will be invoked for a request. It takes a request and a response as parameters and returns `any`.
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
  response: ServerResponse,
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
    response: ServerResponse,
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
You can then add routes to it by giving it a path and a handler.

`Router` can be parametized with request and response types, allowing your handlers to use these and not have typing problems.
This can let us use Express' `Request` and `Response` types and use all of their methods.

```typescript
import express, { Application, Request, Response } from "express";
import { Router } from "@fwl/web";

export function createApp(tracer, logger): Application {
  const router = new Router<Request, Response>([
    loggingMiddleware(tracer, logger),
    errorMiddleware(tracer),
  ]);

  router.get("/ping", pingHandler(tracer));
  router.get("/users/:id", userHandler.getUserById(tracer));
  router.post("/users", userHandler.createUser(tracer));

  return createApp(express(), [withAuthRouter, router]);
}
```

If you need to add a middleware to one route in particular, you can use `wrapMiddlewares`:

```typescript
import express, { Application, Request, Response } from "express";
import { Router } from "@fwl/web";
import {
  errorMiddleware,
  loggingMiddleware,
  wrapMiddlewares,
} from "@fwl/web/dist/middlewares";

export function createApp(tracer, logger): Application {
  const router = new Router<Request, Response>([
    loggingMiddleware(tracer, logger),
    errorMiddleware(tracer),
  ]);

  router.get("/ping", pingHandler(tracer));
  router.get("/users/:id", userHandler.getUserById(tracer));
  router.post(
    "/users",
    wrapMiddlewares([someAuthMiddleware], userHandler.createUser(tracer)),
  );

  return createApp(express(), [withAuthRouter, router]);
}
```

You can also create several routers (take care to add the basic middlewares too though):

```typescript
import express, { Application, Request, Response } from "express";
import { errorMiddleware, loggingMiddleware } from "@fwl/web/dist/middlewares";
import { Router } from "@fwl/web";

export function createApp(tracer, logger): Application {
  const router = new Router<Request, Response>([
    loggingMiddleware(tracer, logger),
    errorMiddleware(tracer),
  ]);

  router.get("/ping", pingHandler(tracer));
  router.get("/users/:id", userHandler.getUserById(tracer));

  const withAuthRouter = new Router([
    loggingMiddleware(tracer, logger),
    errorMiddleware(tracer),
    someAuthMiddleware,
  ]);
  withAuthRouter.post("/users", userHandler.createUser(tracer));

  return createApp(express(), [withAuthRouter, router]);
}
```

### Endpoint

`Endpoint` is thought for Next.JS as its main goal is to deal with file based routing.
Creating an Endpoint lets you set Handlers to HTTP verbs:

```typescript
import { Endpoint } from "@fwl/web";

function handler(request, response) {
  // ...
}

export default new Endpoint().get(handler);
```

By doing that, all requests on this endpoint that are not `GET` will not call the Handler and returns a `403 Method Not Allowed`.

You can also chain it to allow several verbs:

```typescript
import { Endpoint } from "@fwl/web";

function handler(request, response) {
  // ...
}

export default new Endpoint().put(handler).patch(handler);
```

Applying middlewares can be done like so:

```typescript
import { Endpoint } from "@fwl/web";
import {
  errorMiddleware,
  loggingMiddleware,
  recoveryMiddleware,
  tracingMiddleware,
  wrapMiddlewares,
} from "@fwl/web/dist/middlewares";

function handler(request, response) {
  // ...
}

const wrappedHandler = wrapMiddlewares(
  [
    tracingMiddleware(tracer),
    loggingMiddleware(tracer, logger),
    errorMiddleware(tracer),
    recoveryMiddleware(tracer),
  ],
  handler,
);
export default new Endpoint().get(wrappedHandler);
```

### Dealing With Errors

This package provides one way to deal with errors by combining a `WebError` error type and a middleware.
Here's an example:

```typescript
export class UserNotFoundError extends WebError {}

export function getUserById(tracer: Tracer) {
  return (request, response): Promise<void> => {
    return tracer.span("get-user-by-id", async (span) => {
      span.setDisclosedAttribute("user-id", request.params.id);

      const user = users.find((user) => user.id === request.params.id);

      if (!user) {
        throw new UserNotFoundError({
          error: {
            code: "TST_201229_YNXL",
            message: "No user found",
          },
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      response.statusCode = HttpStatus.OK;
      sendJSON(response, user);
    });
  };
}
```

Throwing this error will result in a `404 Not Found` with a JSON body with `code` and `message`.
This is done by catching the error in the `errorMiddleware` and setting the response if it's an instance of `WebError`.

> ⚠️ If you use both `loggingMiddleware` and `errorMiddleware` the order must be logging, then error.
> Otherwise, the error message will not be logged.

### Middlewares

This package provides a middleware API different from Express.
Instead of receiving the Request, Response and a function to go to the next middleware (the last middleware being the handler), we choose to have middlewares receive a handler and gives back a handler.

The main advantage is that a middleware like that can do operations before the handler, after or both.
For instance, that's how the logging middleware is constructed: calling the handler, setting the result aside, logging and returning the result.

To be able to use those middlewares, you can use `wrapMiddlewares` to create a handler with its associated middlewares:

> ⚠️ Middlewares are set in the order of their execution, meaning that the first middleware you put in the array will be the closest to the Handler.
> Said differently, if `middlewareX` did something that needed to be done before we could use `middlewareY`, the order should be `[middlewareX, middlewareY]`.

```typescript
import { wrappMiddlewares } from "@fwl/web/dist/middlewares";

const wrappedhandler = wrapMiddlewares([middleware1, middleware2], handler);
```

We also provide a conversion function for Express middlewares:

```typescript
import { convertMiddleware } from "@fwl/web/dist/express";
import cookieParser from "cookie-parser";
// get your tracer as usual

const fwlCookieParser = convertMiddleware(tracer, cookieParser());
```

#### Logging Middleware

This middleware will log each requests with:

- the path,
- the duration of the request,
- the HTTP method,
- the IP address that initiated the request,
- the status code of the request,
- the trace ID for the request.

The log message will either be empty in case of success or contain the error message if an error was thrown somewhere.

If you're throwing a `WebError`, the status code of this error will be logged.

#### Error Middleware

This middleware will capture `WebError` thrown in middlewares or handlers and return a formatted Response, with the status code of the error and the error code and message as JSON.

If you don't want to use `WebError`, you can either don't use it or recode your own for your own errors.

> ⚠️ If you use both `loggingMiddleware` and `errorMiddleware` the order must be logging, then error.
> Otherwise, the error message will not be logged.

#### Recovery Middleware

This middleware only goal is to catch errors and return a 500 Internal Server Error.
This way, your server will not crash and leak errors when something unexpected happens.

It will also add the error message and stacktrace in the trace of the request for debugging purposes.

#### Tracing Middleware

This middleware should not be used with an Express server as the tracer will automatically create traces.
It's not the case with Next.JS though and this middleware only task is to create a trace on which to attach the different spans.

> ⚠️ If it's used, it should be the first middleware of the list since the others will try to create spans.

### Usage for Express

This package provides a `createApp` function that create an Express Application from an empty Express app and a list of Routers.
You also can parametize the Router with Express' `Request` and `Response` type to allow your handlers to use these types without any TypeScript problem.

Here's a basic application creation:

```typescript
import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fwl/tracing";
import { Router } from "@fwl/web";
import { createApp } from "@fwl/web/dist/express";
import {
  loggingMiddleware,
  errorMiddleware,
  recoveryMiddleware,
} from "@fwl/web/dist/middlewares";
import express, { Application, Request, Response } from "express";

export function start(tracer: Tracer, logger: Logger): Application {
  const router = new Router<Request, Response>([
    loggingMiddleware(tracer, logger),
    errorMiddleware(tracer),
    recoveryMiddleware(tracer),
  ]);

  router.get("/ping", pingHandler(tracer));

  return createApp(express(), [router]);
}
```

Typing the Router like so allows the Handler to look like this:

```typescript
import { Tracer } from "@fwl/tracing";
import { HttpStatus } from "@fwl/web";
import { Request, Response } from "express";

export function pingHandler(tracer: Tracer) {
  return (request: Request, response: Response): Promise<void> => {
    return tracer.span("ping-handler", async () => {
      response.status(HttpStatus.OK).end("OK");
    });
  };
}
```

> Notice we couldn't have use `response.status` with a `ServerResponse` type, this function is from Express.

We also provide a conversion function for Express middlewares:

```typescript
import { convertMiddleware } from "@fwl/web/dist/express";
import cookieParser from "cookie-parser";
// get your tracer as usual

const fwlCookieParser = convertMiddleware(tracer, cookieParser());
```

### Usage for Next.Js

Next.JS does not allow our tracing library to patch the underlying node packages: that means that we need to have a middleware which creates the first span.

Here's an example of the `hello` API page with an added error:

```typescript
import { Endpoint, HttpStatus } from "@fwl/web";
import { WebError } from "@fwl/web/dist/errors";
import {
  loggingMiddleware,
  wrapMiddlewares,
  tracingMiddleware,
  errorMiddleware,
  recoveryMiddleware,
} from "@fwl/web/dist/middlewares";
import { NextApiRequest, NextApiResponse } from "next";

import logger from "../../logger";
import getTracer from "../../tracer";

const tracer = getTracer();

const handler = (
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> => {
  return tracer.span("hello handler", async (span) => {
    if (request.query.someQueryParam) {
      span.setDisclosedAttribute(
        "someQueryParam",
        request.query.someQueryParam,
      );
      throw new WebError({
        error: {
          code: "1",
          message: "oups",
        },
        httpStatus: HttpStatus.NOT_ACCEPTABLE,
      });
    }

    response.statusCode = 200;
    response.json({ name: "John Doe" });
  });
};

const wrappedHandler = wrapMiddlewares(
  [
    tracingMiddleware(tracer),
    recoveryMiddleware(tracer),
    errorMiddleware(tracer),
    loggingMiddleware(tracer, logger),
  ],
  handler,
);
export default new Endpoint().get(wrappedHandler).getHandler();
```

Usage in a React Page is a bit different because we always need to be returning something and you may need to access `context.params`.
You can use the `getServerSidePropsWithMiddlewares` function that takes the context, a list of middlewares and a handler.
Here's an example with the same middlewares as the API Page:

```typescript
import {
  loggingMiddleware,
  tracingMiddleware,
  errorMiddleware,
  recoveryMiddleware,
} from "@fwl/web/dist/middlewares";
import { getServerSidePropsWithMiddlewares } from "@fwl/web/dist/next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getServerSidePropsWithMiddlewares(
    context,
    [
      tracingMiddleware(tracer),
      recoveryMiddleware(tracer),
      errorMiddleware(tracer),
      loggingMiddleware(tracer, logger),
    ],
    () => {
      // do something with `context.params` here
      return {
        props: {},
      };
    },
  );
};
```
