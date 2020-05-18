# FWL Web

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides a typed interface on top of Express with a way of defining errors, a Router and a function to bootstrap an application.

## Installation

```shell
yarn add @fewlines/fwl-web
```

## Usage

### Router

The `Router` of this package is an abstraction on top of the basic Express Router, it is charged with sending the response and displaying the errors.

It takes a `tracer` and a `logger` in its constructor and its API looks a bit like what Express is expecting but we need to pass the types of data the handler will receive.

There are differences between `.get` and the other methods:
- `.get` will need to type the `params` that it will receive.
- `.post`, `.patch`, `.delete` will need to type both the `params` and the `body` they will receive.

`params` is a merge of Query Strings (`?offset=10`) and Named Parameters (e.g. the `id` in `/path/:id`).
Please beware, Named Parameters will have precedence over Query Strings, meaning that for the path `/user/:id`, the URL `/user/1?id=2` will have a `params.id` equal to `1`.

```typescript
const router = new Router(tracer, logger);

router.get<{}>("/", handler);
router.get<{id: string}>("/path/:id", anotherHandler);
router.post<{}, {name: string, description: string}>("/path", postHandler);
router.patch<{id: string}, {name?: string, description?: string}>("/path/:id", patchHandler);
router.delete<{id: string}, {}>("/path/:id", deleteHandler);
```

For more information, please look at the [example](./example/).

### Handler

Contrary to Express where the handler takes the `request` and the `response` as argument, this router gives the handler 5 parameters in that order:
- The `tracer` instance: we want to trace as much as possible so this is the first thing that we receive.
- A `resolve` function, continue reading for more information.
- A `reject` function, continue reading for more information.
- The `params` of this request with the URL Params, the Query Params in `GET` and the Body Params (parsed from JSON) in other HTTP verbs requests.
- If needed, the full `request` object.

Let's see an example:

```typescript
// First we define the route wit an URL Parameter
router.get<{name: string}>("/my/:name", myHandler(database));
```

```typescript
import { Request } from "express";
import { Tracer } from "@fewlines/fwl-tracing";
import {
  HandlerPromise,
  HttpStatus,
  RejectFunction,
  ResolveFunction,
} from "@fewlines/fwl-web";

// We create a handler that accept dependencies and return the real handler
export function myHandler(database) {
  return (
    tracer: Tracer,
    resolve: ResolveFunction,
    reject: RejectFunction,
    params: { name: string; },
    request: Request,
  ): HandlerPromise => {
    //  Most of the time, we will want to create a span around our handler
    return tracer.span("my-resource-handler", async (span) => {

        // We can add atributes to our Trace Span
        span.setAttribute("my_resource_name", params.name);

        const { rows } = await database.query(
          "SELECT id, name FROM my_resource_table WHERE name = $1",
          [params.name],
        );

        if (rows.length === 0) {
          // If we have an error, we return a factory for it (see Dealing With Errors)
          return reject(MyResourceNotFoundError());
        }

        const myData = rows.map((row) => ({id: row.id, name: row.name}));

        // If all goes well, we can return the resolve with an HTTP 200 OK and `myData`
        return resolve(HttpStatus.OK, myData);
    });
  };
}
```

For more information, please look at the [example](./example/).

### Dealing With Errors

We want to unify the way we deal with errors so we have a recommended way.
The global idea is to have only one place where the errors of a Service are defined.
Each of these is a `WebError` with an HTTP status, a unique code and a message.

Here is how to define our `MyNotFoundError` in the previous example:

```typescript
// src/errors.ts
import {
  HttpStatus,
  WebError,
  WebErrorMessages,
} from "@fewlines/fwl-web";

const Errors: WebErrorMessages = {
  MY_RESOURCE_NOT_FOUND: { code: 400001, message: "My Resource not found" },
};

export function MyResourceNotFoundError() {
  return new WebError({
    error: Errors.MY_RESOURCE_NOT_FOUND,
    httpStatus: HttpStatus.NOT_FOUND,
  });
}
```

⚠️ Don't make two errors the same if they occur in different places in the Service even if they look similar.

### Logging middleware

This package exposes a `loggingMiddleware` that takes a `tracer` and a `logger` as parameter, returns an express middleware, and that will make one log per request.

This log will contain:
- the duration of the request in microseconds,
- the path that was hit on the server,
- the method that was used,
- the status code returned for this request,
- and the remote address that made the call.

It can be used in the second argument of `createApp`:

```typescript
createApp(router, [loggingMiddleware(tracer, logger)]);
```

### Create the application

```typescript
import { Application } from "express";
import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fewlines/fwl-tracing";
import {
  createApp,
  loggingMiddleware,
  Router,
} from "@fewlines/fwl-web";
import { handler } from "./handlers";

export function bootstrap( tracer: Tracer, logger: Logger): Application {
  const router = new Router(tracer, logger);

  router.get<{}>("/", handler(spartaApiClient));

  return createApp(router, [loggingMiddleware(tracer, logger)]);
}
```
