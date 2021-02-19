import { InMemoryTracer } from "@fwl/tracing";
import httpMock from "mock-http";

import { HttpStatus } from "../../index";
import { WebError } from "../../src/errors";
import {
  wrapMiddlewares,
  errorMiddleware,
  tracingMiddleware,
} from "../../src/middlewares";

test("catch the error when a WebError is thrown and update the status code and the body accordingly", async () => {
  expect.assertions(2);

  const tracer = new InMemoryTracer();
  const middleware = errorMiddleware(tracer);
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
    [tracingMiddleware(tracer), middleware],
    handler,
  );
  const response = new httpMock.Response();

  await wrappedhandler(
    new httpMock.Request({
      url: "/test",
    }),
    response,
  );

  expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  expect(response._internal.buffer.toString()).toBe(JSON.stringify(error));
});

test("catch the error when a WebError is thrown, update the status code and the body accordingly, and return {props:{}} in the context of Next.JS", async () => {
  expect.assertions(2);

  const tracer = new InMemoryTracer();
  const middleware = errorMiddleware(tracer);
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

  handler["__nextjs"] = true;

  const wrappedhandler = wrapMiddlewares(
    [tracingMiddleware(tracer), middleware],
    handler,
  );
  const response = new httpMock.Response();

  const returnedProps = await wrappedhandler(
    new httpMock.Request({
      url: "/test",
    }),
    response,
  );

  expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  expect(returnedProps).toMatchObject({ props: {} });
});

test("does not catch the error when something else than a WebError is thrown", async () => {
  expect.assertions(2);

  const tracer = new InMemoryTracer();
  const middleware = errorMiddleware(tracer);
  const handler = (): void => {
    throw new Error("unexpected error");
  };
  const wrappedhandler = wrapMiddlewares(
    [tracingMiddleware(tracer), middleware],
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
  } catch (error) {
    expect(response.statusCode).not.toBeDefined();
    expect(error.message).toBe("unexpected error");
  }
});
