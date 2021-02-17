import { InMemoryTracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";
import memjs from "memjs";
import httpMock from "mock-http";

import { HttpStatus } from "../../index";
import { wrapMiddlewares, rateLimitingMiddleware } from "../../src/middlewares";
import { InMemoryLogger } from "../utils";

const handler = (request: IncomingMessage, response: ServerResponse): void => {
  response.statusCode = HttpStatus.OK;
  response.end();
};

describe("InMemoryStore", () => {
  test("should return a TOO_MANY_REQUEST when the maxRequest count is reached", async () => {
    expect.assertions(3);

    const tracer = new InMemoryTracer();
    const logger = new InMemoryLogger();

    const middleware = rateLimitingMiddleware(tracer, logger, {
      windowMs: 1000,
      requestsUntilBlock: 2,
    });
    const wrappedhandler = wrapMiddlewares([middleware], handler);
    const request = new httpMock.Request({
      url: "/test",
    });

    const response1 = new httpMock.Response();
    await wrappedhandler(request, response1);

    const response2 = new httpMock.Response();
    await wrappedhandler(request, response2);

    const response3 = new httpMock.Response();
    await wrappedhandler(request, response3);

    expect(response1.statusCode).toBe(HttpStatus.OK);
    expect(response2.statusCode).toBe(HttpStatus.OK);
    expect(response3.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  test("should not block request if requestsUntilBlock is 0", async () => {
    expect.assertions(3);

    const tracer = new InMemoryTracer();
    const logger = new InMemoryLogger();

    const middleware = rateLimitingMiddleware(tracer, logger, {
      windowMs: 1000,
      requestsUntilBlock: 0,
    });
    const wrappedhandler = wrapMiddlewares([middleware], handler);
    const request = new httpMock.Request({
      url: "/test",
    });

    const response1 = new httpMock.Response();
    await wrappedhandler(request, response1);

    const response2 = new httpMock.Response();
    await wrappedhandler(request, response2);

    const response3 = new httpMock.Response();
    await wrappedhandler(request, response3);

    expect(response1.statusCode).toBe(HttpStatus.OK);
    expect(response2.statusCode).toBe(HttpStatus.OK);
    expect(response3.statusCode).toBe(HttpStatus.OK);
  });

  test("should slow down the request when the slowDown count is reached", async () => {
    expect.assertions(11);

    const tracer = new InMemoryTracer();
    const logger = new InMemoryLogger();

    const middleware = rateLimitingMiddleware(tracer, logger, {
      windowMs: 1000,
      requestsUntilBlock: 5,
      slowDown: {
        incrementalDelayBetweenRequestMs: 500,
        requestsUntilDelay: 2,
      },
    });
    const wrappedhandler = wrapMiddlewares([middleware], handler);
    const request = new httpMock.Request({
      url: "/test",
    });

    async function makeRequest(): Promise<
      [response: ServerResponse, duration: number]
    > {
      const response = new httpMock.Response();
      const startTime = process.hrtime.bigint();

      await wrappedhandler(request, response);
      const endTime = process.hrtime.bigint();
      const duration = Number((endTime - startTime) / BigInt(1000000));
      return [response, duration];
    }

    const [response1, duration1] = await makeRequest();
    const [response2, duration2] = await makeRequest();
    const [response3, duration3] = await makeRequest();
    const [response4, duration4] = await makeRequest();
    const [response5, duration5] = await makeRequest();
    const [response6] = await makeRequest();

    expect(response1.statusCode).toBe(HttpStatus.OK);
    expect(duration1).toBeLessThan(100);
    expect(response2.statusCode).toBe(HttpStatus.OK);
    expect(duration2).toBeLessThan(100);
    expect(response3.statusCode).toBe(HttpStatus.OK);
    expect(duration3).toBeGreaterThan(450);
    expect(response4.statusCode).toBe(HttpStatus.OK);
    expect(duration4).toBeGreaterThan(950);
    expect(response5.statusCode).toBe(HttpStatus.OK);
    expect(duration5).toBeGreaterThan(1450);
    expect(response6.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  test("should only slow down the request when the slowDown count is reached and requestsUntilBlock is 0", async () => {
    expect.assertions(11);

    const tracer = new InMemoryTracer();
    const logger = new InMemoryLogger();

    const middleware = rateLimitingMiddleware(tracer, logger, {
      windowMs: 1000,
      requestsUntilBlock: 0,
      slowDown: {
        incrementalDelayBetweenRequestMs: 500,
        requestsUntilDelay: 2,
      },
    });
    const wrappedhandler = wrapMiddlewares([middleware], handler);
    const request = new httpMock.Request({
      url: "/test",
    });

    async function makeRequest(): Promise<
      [response: ServerResponse, duration: number]
    > {
      const response = new httpMock.Response();
      const startTime = process.hrtime.bigint();

      await wrappedhandler(request, response);
      const endTime = process.hrtime.bigint();
      const duration = Number((endTime - startTime) / BigInt(1000000));
      return [response, duration];
    }

    const [response1, duration1] = await makeRequest();
    const [response2, duration2] = await makeRequest();
    const [response3, duration3] = await makeRequest();
    const [response4, duration4] = await makeRequest();
    const [response5, duration5] = await makeRequest();
    const [response6] = await makeRequest();

    expect(response1.statusCode).toBe(HttpStatus.OK);
    expect(duration1).toBeLessThan(100);
    expect(response2.statusCode).toBe(HttpStatus.OK);
    expect(duration2).toBeLessThan(100);
    expect(response3.statusCode).toBe(HttpStatus.OK);
    expect(duration3).toBeGreaterThan(450);
    expect(response4.statusCode).toBe(HttpStatus.OK);
    expect(duration4).toBeGreaterThan(950);
    expect(response5.statusCode).toBe(HttpStatus.OK);
    expect(duration5).toBeGreaterThan(1450);
    expect(response6.statusCode).toBe(HttpStatus.OK);
  });

  test("should work again after waiting the right amount of time", async () => {
    expect.assertions(6);

    function sleep(timeMs: number): Promise<void> {
      return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
      });
    }

    async function makeRequest(): Promise<ServerResponse> {
      const response = new httpMock.Response();

      await wrappedhandler(request, response);
      return response;
    }

    const windowMs = 1000;

    const tracer = new InMemoryTracer();
    const logger = new InMemoryLogger();

    const middleware = rateLimitingMiddleware(tracer, logger, {
      windowMs,
      requestsUntilBlock: 2,
    });
    const wrappedhandler = wrapMiddlewares([middleware], handler);
    const request = new httpMock.Request({
      url: "/test",
    });

    const response1 = await makeRequest();
    const response2 = await makeRequest();
    const response3 = await makeRequest();
    const response4 = await makeRequest();

    await sleep(windowMs + 100);
    const response5 = await makeRequest();
    const response6 = await makeRequest();

    expect(response1.statusCode).toBe(HttpStatus.OK);
    expect(response2.statusCode).toBe(HttpStatus.OK);
    expect(response3.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(response4.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(response5.statusCode).toBe(HttpStatus.OK);
    expect(response6.statusCode).toBe(HttpStatus.OK);
  });
});

describe("MemcacheStore", () => {
  let memcachedClient: memjs.Client;

  beforeAll(() => {
    memcachedClient = memjs.Client.create(
      "memcached:memcached@localhost:11211",
      {},
    );
  });
  afterAll(() => {
    memcachedClient.close();
  });
  beforeEach(() => memcachedClient.delete("127.0.0.1"));

  test("should return a TOO_MANY_REQUEST when the maxRequest count is reached", async () => {
    expect.assertions(3);
    const tracer = new InMemoryTracer();
    const logger = new InMemoryLogger();

    const middleware = rateLimitingMiddleware(tracer, logger, {
      windowMs: 1000,
      requestsUntilBlock: 2,
      memcachedClient,
    });
    const wrappedhandler = wrapMiddlewares([middleware], handler);
    const request = new httpMock.Request({
      url: "/test",
    });

    const response1 = new httpMock.Response();
    await wrappedhandler(request, response1);

    const response2 = new httpMock.Response();
    await wrappedhandler(request, response2);

    const response3 = new httpMock.Response();
    await wrappedhandler(request, response3);

    expect(response1.statusCode).toBe(HttpStatus.OK);
    expect(response2.statusCode).toBe(HttpStatus.OK);
    expect(response3.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  test("should slow down the request when the slowDown count is reached", async () => {
    expect.assertions(11);

    const tracer = new InMemoryTracer();
    const logger = new InMemoryLogger();

    const middleware = rateLimitingMiddleware(tracer, logger, {
      windowMs: 1000,
      requestsUntilBlock: 5,
      slowDown: {
        incrementalDelayBetweenRequestMs: 500,
        requestsUntilDelay: 2,
      },
      memcachedClient,
    });
    const wrappedhandler = wrapMiddlewares([middleware], handler);
    const request = new httpMock.Request({
      url: "/test",
    });

    async function makeRequest(): Promise<
      [response: ServerResponse, duration: number]
    > {
      const response = new httpMock.Response();
      const startTime = process.hrtime.bigint();

      await wrappedhandler(request, response);
      const endTime = process.hrtime.bigint();
      const duration = Number((endTime - startTime) / BigInt(1000000));
      return [response, duration];
    }

    const [response1, duration1] = await makeRequest();
    const [response2, duration2] = await makeRequest();
    const [response3, duration3] = await makeRequest();
    const [response4, duration4] = await makeRequest();
    const [response5, duration5] = await makeRequest();
    const [response6] = await makeRequest();

    expect(response1.statusCode).toBe(HttpStatus.OK);
    expect(duration1).toBeLessThan(100);
    expect(response2.statusCode).toBe(HttpStatus.OK);
    expect(duration2).toBeLessThan(100);
    expect(response3.statusCode).toBe(HttpStatus.OK);
    expect(duration3).toBeGreaterThan(450);
    expect(response4.statusCode).toBe(HttpStatus.OK);
    expect(duration4).toBeGreaterThan(950);
    expect(response5.statusCode).toBe(HttpStatus.OK);
    expect(duration5).toBeGreaterThan(1450);
    expect(response6.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  test("should work again after waiting the right amount of time", async () => {
    expect.assertions(6);

    function sleep(timeMs: number): Promise<void> {
      return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
      });
    }

    async function makeRequest(): Promise<ServerResponse> {
      const response = new httpMock.Response();

      await wrappedhandler(request, response);
      return response;
    }

    const windowMs = 1000;

    const tracer = new InMemoryTracer();
    const logger = new InMemoryLogger();

    const middleware = rateLimitingMiddleware(tracer, logger, {
      windowMs,
      requestsUntilBlock: 2,
      memcachedClient,
    });
    const wrappedhandler = wrapMiddlewares([middleware], handler);
    const request = new httpMock.Request({
      url: "/test",
    });

    const response1 = await makeRequest();
    const response2 = await makeRequest();
    const response3 = await makeRequest();
    const response4 = await makeRequest();

    await sleep(windowMs + 1000);
    const response5 = await makeRequest();
    const response6 = await makeRequest();

    expect(response1.statusCode).toBe(HttpStatus.OK);
    expect(response2.statusCode).toBe(HttpStatus.OK);
    expect(response3.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(response4.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(response5.statusCode).toBe(HttpStatus.OK);
    expect(response6.statusCode).toBe(HttpStatus.OK);
  });
});
