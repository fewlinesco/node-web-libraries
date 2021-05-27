import { Logger } from "@fwl/logging";
import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";
import memjs from "memjs";

import { HttpStatus } from "../http-statuses";
import { Middleware } from "../typings/middleware";

function getAddr(request: IncomingMessage): string {
  if (request.headers["x-forwarded-for"]) {
    return request.headers["x-forwarded-for"].toString();
  } else if (request.connection.remoteAddress) {
    return request.connection.remoteAddress.toString();
  }
  return "";
}

type Options = {
  windowMs: number;
  slowDown?: {
    requestsUntilDelay: number;
    incrementalDelayBetweenRequestMs: number;
  };
  requestsUntilBlock: number;
  memcachedClient?: memjs.Client;
};

interface Store {
  increment(key: string): Promise<number>;
}

class InMemoryStore implements Store {
  private expiration: number;
  private cache: Record<string, { count: number; expires: number }> = {};

  constructor(options: { expiration: number }) {
    this.expiration = options.expiration;
  }

  increment(key: string): Promise<number> {
    const now = new Date().getTime();
    if (!this.cache[key] || this.cache[key].expires < now) {
      this.cache[key] = {
        count: 1,
        expires: now + this.expiration,
      };
    } else {
      this.cache[key] = {
        count: this.cache[key].count + 1,
        expires: now + this.expiration,
      };
    }
    return Promise.resolve(this.cache[key].count);
  }
}

class MemcacheStore implements Store {
  private client: memjs.Client;
  private expiration: number;

  constructor(options: { client: memjs.Client; expiration: number }) {
    this.client = options.client;
    this.expiration = options.expiration;
  }
  async increment(key: string): Promise<number> {
    const options = {
      expires: Math.ceil(this.expiration / 1000) + 1,
    };

    const { value } = await this.client.get(key);
    if (value === null) {
      await this.client.set(key, Buffer.from("1"), options);
      return 1;
    } else {
      const count = parseFloat(value.toString());
      const newCount = count + 1;
      await this.client.delete(key);

      await this.client.set(key, Buffer.from(String(newCount)), options);
      return newCount;
    }
  }
}

function sleep(timeMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

function getExpirationTime(options: Options): number {
  if (options.slowDown) {
    if (options.requestsUntilBlock === 0) {
      return Math.min(
        3000,
        (options.slowDown.requestsUntilDelay + 1) *
          options.slowDown.incrementalDelayBetweenRequestMs,
      );
    } else {
      return Math.max(
        (options.requestsUntilBlock - options.slowDown.requestsUntilDelay + 1) *
          options.slowDown.incrementalDelayBetweenRequestMs,
        options.windowMs,
      );
    }
  } else {
    return options.windowMs;
  }
}

function rateLimitingMiddleware<
  T extends IncomingMessage,
  U extends ServerResponse,
>(tracer: Tracer, logger: Logger, options: Options): Middleware<T, U> {
  let store: Store;
  const expiration = getExpirationTime(options);

  if (options.memcachedClient) {
    store = new MemcacheStore({
      client: options.memcachedClient,
      expiration,
    });
  } else {
    store = new InMemoryStore({ expiration });
  }

  return function withFwlRateLimitingHandler(handler) {
    return async (request: T, response: U) => {
      const startTime = process.hrtime.bigint();
      const ip = getAddr(request);
      const count = await store.increment(ip);

      if (
        options.slowDown &&
        count > options.slowDown.requestsUntilDelay &&
        (count <= options.requestsUntilBlock ||
          options.requestsUntilBlock === 0)
      ) {
        const span = tracer.createSpan("rate-limit-slow-down");
        span.setDisclosedAttribute("ip", ip);
        await sleep(
          options.slowDown.incrementalDelayBetweenRequestMs *
            (count - options.slowDown.requestsUntilDelay),
        );
        span.end();
      }
      if (
        options.requestsUntilBlock > 0 &&
        count > options.requestsUntilBlock
      ) {
        const endTime = process.hrtime.bigint();
        const duration = ((endTime - startTime) / BigInt(1000000)).toString();
        logger.log("Blocked because of too many requests", {
          duration,
          method: request.method ? request.method : "Undefined method",
          path: request.url ? request.url : "Undefined request URL",
          remoteaddr: ip,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        });
        response.statusCode = HttpStatus.TOO_MANY_REQUESTS;
        return response.end();
      }
      return handler(request, response);
    };
  };
}

export { rateLimitingMiddleware };
