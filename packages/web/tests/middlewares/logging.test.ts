import { InMemoryTracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";
import httpMock from "mock-http";

import { HttpStatus } from "../../index";
import { WebError } from "../../src/errors";
import { wrapMiddlewares, loggingMiddleware } from "../../src/middlewares";
import { InMemoryLogger } from "../utils";

test("logs a good result", async () => {
  expect.assertions(1);

  const tracer = new InMemoryTracer();
  const logger = new InMemoryLogger();
  const middleware = loggingMiddleware(tracer, logger);
  const handler = (
    request: IncomingMessage,
    response: ServerResponse,
  ): void => {
    response.end();
  };
  const wrappedhandler = wrapMiddlewares([middleware], handler);

  await wrappedhandler(
    new httpMock.Request({
      url: "/test",
    }),
    new httpMock.Response(),
  );

  expect(logger.getLog(0)).toMatchObject({
    message: "",
    path: "/test",
    remoteaddr: "127.0.0.1",
    statusCode: 200,
    traceid: "1",
  });
});

test("logs the error message with the right statusCode when a WebError is thrown", async () => {
  expect.assertions(2);

  const tracer = new InMemoryTracer();
  const logger = new InMemoryLogger();
  const middleware = loggingMiddleware(tracer, logger);
  const handler = (): void => {
    throw new WebError({
      error: {
        code: "TST_201221_HGTE",
        message: "something wrong happened",
      },
      httpStatus: HttpStatus.NOT_FOUND,
    });
  };
  const wrappedhandler = wrapMiddlewares([middleware], handler);

  try {
    await wrappedhandler(
      new httpMock.Request({
        url: "/test",
      }),
      new httpMock.Response(),
    );
  } catch (error) {
    const log = logger.getLog(0);
    expect(log).toMatchObject({
      message: "Error: something wrong happened",
      path: "/test",
      remoteaddr: "127.0.0.1",
      statusCode: HttpStatus.NOT_FOUND,
      traceid: "1",
    });
    expect(log.message).toBe(error.toString());
  }
});

test("should log a 500 when an unknown error is thrown", async () => {
  expect.assertions(2);

  const tracer = new InMemoryTracer();
  const logger = new InMemoryLogger();
  const middleware = loggingMiddleware(tracer, logger);
  const handler = (): void => {
    throw new Error("something wrong happened");
  };
  const wrappedhandler = wrapMiddlewares([middleware], handler);

  try {
    await wrappedhandler(
      new httpMock.Request({
        url: "/test",
      }),
      new httpMock.Response(),
    );
  } catch (error) {
    const log = logger.getLog(0);
    expect(log).toMatchObject({
      message: "Error: something wrong happened",
      path: "/test",
      remoteaddr: "127.0.0.1",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      traceid: "1",
    });
    expect(log.message).toBe(error.toString());
  }
});