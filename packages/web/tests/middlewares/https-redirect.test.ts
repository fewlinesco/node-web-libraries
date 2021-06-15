import { InMemoryTracer } from "@fwl/tracing";
import httpMock from "mock-http";

import { HttpStatus } from "../../index";
import {
  wrapMiddlewares,
  errorMiddleware,
  httpsRedirectMiddleware,
} from "../../src/middlewares";

test("catch the error when a WebError is thrown and update the status code and the body accordingly", async () => {
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
  const response = new httpMock.Response();

  await wrappedhandler(
    new httpMock.Request({
      url: "/test",
      headers: {
        host: "http://example.net?query=string",
      },
    }),
    response,
  );

  expect(response.statusCode).toBe(HttpStatus.PERMANENT_REDIRECT);
  expect(response.getHeader("Location")).toBe(
    "https://example.net?query=string",
  );
});
