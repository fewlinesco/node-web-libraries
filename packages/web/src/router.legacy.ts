import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fwl/tracing";
import { json as jsonParser } from "body-parser";
import { Router as expressRouter, Request, NextFunction } from "express";
import * as Express from "express-serve-static-core";
import { IncomingMessage, ServerResponse } from "http";

import { UnmanagedError, WebError } from "./errors";
import { HttpStatus } from "./http-statuses";
import { query, readBody, redirect, sendFile, setHeaders } from "./utils";

export type EmptyParams = Record<string, unknown>;

export type EmptyBody = Record<string, unknown>;

export type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

export enum ResolveOrReject {
  RESOLVE,
  REJECT,
}
interface ResolveOptions {
  file?: boolean;
}

export type ResolveFunction = (
  status: HttpStatus,
  returnValue?: unknown,
  headers?: Record<string, string>,
  options?: ResolveOptions,
) => HandlerPromise;

export type HandlerWithoutBody<T extends Record<string, unknown>> = (
  tracer: Tracer,
  resolve: ResolveFunction,
  reject: RejectFunction,
  params: T,
  request: IncomingMessage,
) => HandlerPromise;

export type HandlerWithBody<T, U> = (
  tracer: Tracer,
  resolve: ResolveFunction,
  reject: RejectFunction,
  params: T,
  body: U,
  request: IncomingMessage,
) => HandlerPromise;

export type HandlerPromise = Promise<ResolveOrReject>;

export type RejectFunction = (error: WebError) => HandlerPromise;

export function rejectFactory(
  request: IncomingMessage & { private: { error?: Error } },
  response: ServerResponse,
): RejectFunction {
  return function reject(error: WebError): HandlerPromise {
    if (error.parentError) {
      request.private.error = error.parentError;
    }
    response.statusCode = error.httpStatus;
    response.end(JSON.stringify(error.getMessage()));
    return Promise.resolve(ResolveOrReject.REJECT);
  };
}

function resolveFactory(
  request: IncomingMessage,
  response: ServerResponse,
): ResolveFunction {
  return async function (
    status: HttpStatus,
    value?: unknown,
    headers?: Record<string, string>,
    options: ResolveOptions = {},
  ): HandlerPromise {
    if (
      [
        HttpStatus.MOVED_PERMANENTLY,
        HttpStatus.MOVED_TEMPORARILY,
        HttpStatus.TEMPORARY_REDIRECT,
        HttpStatus.PERMANENT_REDIRECT,
      ].includes(status)
    ) {
      if (typeof value !== "string") {
        throw new Error(
          `Unsupported type for redirection value, excepted string got ${typeof value}`,
        );
      }
      if (headers) {
        setHeaders(response, headers);
      }
      redirect(response, status, value);
    } else if (options.file) {
      if (typeof value !== "string") {
        throw new TypeError("file should be a string");
      }

      response.statusCode = status;
      await sendFile(request, response, value, headers);
    } else {
      response.statusCode = status;

      if (headers) {
        setHeaders(response, headers);
      }
      if (value) {
        if (!response.getHeader("Content-Type")) {
          response.setHeader("Content-Type", "application/json");
        }
        response.end(JSON.stringify(value));
      } else {
        response.end();
      }
    }
    return ResolveOrReject.RESOLVE;
  };
}

export class Router {
  private tracer: Tracer;
  private logger: Logger;
  private router: Express.Router;
  private middlewares: Middleware[];

  constructor(tracer: Tracer, logger: Logger, middlewares: Middleware[] = []) {
    this.tracer = tracer;
    this.logger = logger;
    this.router = expressRouter();
    this.middlewares = middlewares;
  }

  private withBodyResponse<T extends Record<string, unknown>, U>(
    handler: HandlerWithBody<T, U>,
  ) {
    return async (
      request: Request,
      response: ServerResponse,
    ): Promise<void> => {
      const resolve = resolveFactory(request, response);
      const reject = rejectFactory(request, response);
      const params = { ...query(request), ...request.params } as T;
      const body = JSON.parse(await readBody(request)) as U;
      try {
        await handler(this.tracer, resolve, reject, params, body, request);
      } catch (exception) {
        if (exception instanceof WebError) {
          reject(exception);
        } else {
          reject(UnmanagedError(exception));
        }
      }
    };
  }

  post<T extends Record<string, unknown>, U>(
    path: string,
    handler: HandlerWithBody<T, U>,
  ): void {
    this.router.post(
      path,
      jsonParser(),
      ...this.middlewares,
      this.withBodyResponse(handler),
    );
  }

  patch<T extends Record<string, unknown>, U>(
    path: string,
    handler: HandlerWithBody<T, U>,
  ): void {
    this.router.patch(
      path,
      jsonParser(),
      ...this.middlewares,
      this.withBodyResponse(handler),
    );
  }

  delete<T extends Record<string, unknown>, U>(
    path: string,
    handler: HandlerWithBody<T, U>,
  ): void {
    this.router.delete(
      path,
      jsonParser(),
      ...this.middlewares,
      this.withBodyResponse(handler),
    );
  }

  get<T extends Record<string, unknown> = EmptyParams>(
    path: string,
    handler: HandlerWithoutBody<T>,
  ): void {
    this.router.get(
      path,
      ...this.middlewares,
      async (request: Request, response: ServerResponse) => {
        const resolve = resolveFactory(request, response);
        const reject = rejectFactory(request, response);
        const params = { ...request.query, ...request.params } as T;
        try {
          await handler(this.tracer, resolve, reject, params, request);
        } catch (exception) {
          if (exception instanceof WebError) {
            reject(exception);
          } else {
            reject(UnmanagedError(exception));
          }
        }
      },
    );
  }

  getRouter(): Express.Router {
    return this.router;
  }
}
