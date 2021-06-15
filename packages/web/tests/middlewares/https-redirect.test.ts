import { InMemoryTracer } from "@fwl/tracing";
import httpMock from "mock-http";

import { HttpStatus } from "../../index";
import {
  wrapMiddlewares,
  errorMiddleware,
  httpsRedirectMiddleware,
} from "../../src/middlewares";
import { readBody } from "../../src/utils";

test("Redirects to https with permanent redirect code when host is not localhost and specified scheme is http", async () => {
  expect.assertions(2);

  const tracer = new InMemoryTracer();
  const middleware = errorMiddleware(tracer);
  const handler = (): void => {
    response.end("OK");
  };
  const wrappedhandler = wrapMiddlewares(
    [httpsRedirectMiddleware(tracer), middleware],
    handler,
  );

  const host = "test.test";
  const url = "/test?query=string";
  const response = new httpMock.Response();

  await wrappedhandler(
    new httpMock.Request({
      url,
      headers: {
        "x-forwarded-proto": "http",
        host,
      },
    }),
    response,
  );

  expect(response.statusCode).toBe(HttpStatus.PERMANENT_REDIRECT);
  expect(response.getHeader("Location")).toBe(`https://${host}${url}`);
});

test("Do not redirect when the specified scheme is https", async () => {
  expect.assertions(1);

  const tracer = new InMemoryTracer();
  const middleware = errorMiddleware(tracer);
  const handler = (): void => {
    response.end("OK");
  };
  const wrappedhandler = wrapMiddlewares(
    [httpsRedirectMiddleware(tracer), middleware],
    handler,
  );

  const host = "test.test";
  const url = "/test?query=string";
  const response = new httpMock.Response();

  await wrappedhandler(
    new httpMock.Request({
      url,
      headers: {
        "x-forwarded-proto": "https",
        host,
      },
    }),
    response,
  );

  expect(response.statusCode).toBe(HttpStatus.OK);
});

test("Do not redirect on https when host is localhost", async () => {
  expect.assertions(1);

  const tracer = new InMemoryTracer();
  const middleware = errorMiddleware(tracer);
  const handler = (): void => {
    response.end("OK");
  };
  const wrappedhandler = wrapMiddlewares(
    [httpsRedirectMiddleware(tracer), middleware],
    handler,
  );

  const host = "localhost:3000";
  const url = "/test?query=string";
  const response = new httpMock.Response();

  await wrappedhandler(
    new httpMock.Request({
      url,
      headers: {
        "x-forwarded-proto": "https",
        host,
      },
    }),
    response,
  );

  expect(response.statusCode).toBe(HttpStatus.OK);
});

test("Do not redirect when the scheme is https", async () => {
  expect.assertions(1);

  const tracer = new InMemoryTracer();
  const middleware = errorMiddleware(tracer);
  const handler = (): void => {
    response.end("OK");
  };
  const wrappedhandler = wrapMiddlewares(
    [httpsRedirectMiddleware(tracer), middleware],
    handler,
  );

  const host = "test.test";
  const url = "/test?query=string";
  const response = new httpMock.Response();

  await wrappedhandler(
    new httpMock.Request({
      url,
      headers: {
        "x-forwarded-proto": "https",
        host,
      },
    }),
    response,
  );

  expect(response.statusCode).toBe(HttpStatus.OK);
});

test("Transfers the body on redirection", async () => {
  expect.assertions(2);

  const tracer = new InMemoryTracer();
  const middleware = errorMiddleware(tracer);
  const handler = (): void => {
    response.end("OK");
  };
  const wrappedhandler = wrapMiddlewares(
    [httpsRedirectMiddleware(tracer), middleware],
    handler,
  );

  const body = { test: "test" };
  const host = "test.test";
  const url = "/test";
  const response = new httpMock.Response();
  const request = new httpMock.Request({
    url,
    headers: {
      host,
    },
    buffer: Buffer.from(JSON.stringify(body)),
  });

  await wrappedhandler(request, response);

  const requestBody = JSON.parse(await readBody(request));

  expect(requestBody).toMatchObject(body);
  expect(response.statusCode).toBe(HttpStatus.PERMANENT_REDIRECT);
});
