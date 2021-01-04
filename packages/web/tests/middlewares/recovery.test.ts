import { InMemoryTracer } from "@fwl/tracing";
import httpMock from "mock-http";

import { HttpStatus } from "../../index";
import { wrapMiddlewares, recoveryMiddleware } from "../../src/middlewares";

test("catch the error one is thrown and return a 500 Internal Server Error", async () => {
  expect.assertions(1);

  const tracer = new InMemoryTracer();
  const middleware = recoveryMiddleware(tracer);
  const handler = (): void => {
    throw new Error("unexpected error");
  };
  const wrappedhandler = wrapMiddlewares([middleware], handler);
  const response = new httpMock.Response();

  await wrappedhandler(
    new httpMock.Request({
      url: "/test",
    }),
    response,
  );

  expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
});
