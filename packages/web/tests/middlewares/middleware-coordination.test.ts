import { InMemoryTracer } from "@fwl/tracing";
import httpMock from "mock-http";

import { HttpStatus } from "../../index";
import { WebError } from "../../src/errors";
import {
  wrapMiddlewares,
  loggingMiddleware,
  errorMiddleware,
  recoveryMiddleware,
  tracingMiddleware,
} from "../../src/middlewares";
import { InMemoryLogger } from "../utils";

test("logs and catch a WebError correctly", async () => {
  expect.assertions(3);

  const tracer = new InMemoryTracer();
  const logger = new InMemoryLogger();
  const error = {
    code: "TST_201221_HGTE",
    message: "something wrong happened",
  };
  const handler = (): void => {
    throw new WebError({
      error,
      httpStatus: HttpStatus.NOT_FOUND,
    });
  };
  const wrappedhandler = wrapMiddlewares(
    [
      tracingMiddleware(tracer),
      errorMiddleware(tracer),
      loggingMiddleware(tracer, logger),
    ],
    handler,
  );
  const response = new httpMock.Response();

  try {
    await wrappedhandler(
      new httpMock.Request({
        url: "/test",
      }),
      response,
    );

    const log = logger.getLog(0);
    expect(log).toMatchObject({
      message: "Error: something wrong happened",
      path: "/test",
      remoteaddr: "127.0.0.1",
      statusCode: HttpStatus.NOT_FOUND,
      traceid: "1",
    });

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(response._internal.buffer.toString()).toBe(JSON.stringify(error));
  } catch (error) {
    fail("No error should have been throwned but got:\n" + error.toString());
  }
});

test("logs and catch a random error correctly", async () => {
  expect.assertions(2);

  const tracer = new InMemoryTracer();
  const logger = new InMemoryLogger();
  const handler = (): void => {
    throw new Error("unexpected error");
  };
  const wrappedhandler = wrapMiddlewares(
    [
      tracingMiddleware(tracer),
      recoveryMiddleware(tracer),
      errorMiddleware(tracer),
      loggingMiddleware(tracer, logger),
    ],
    handler,
  );
  const response = new httpMock.Response();

  try {
    await wrappedhandler(
      new httpMock.Request({
        url: "/test",
      }),
      response,
    );

    const log = logger.getLog(0);
    expect(log).toMatchObject({
      message: "Error: unexpected error",
      path: "/test",
      remoteaddr: "127.0.0.1",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      traceid: "1",
    });

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  } catch (error) {
    fail("No error should have been throwned but got:\n" + error.toString());
  }
});
