import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fwl/tracing";
import { json as jsonParser } from "body-parser";
import { Router as expressRouter, Request, Response } from "express";
import * as Express from "express-serve-static-core";

import { UnmanagedError, WebError } from "./errors";
import { HttpStatus } from "./http-statuses";
import {
  HandlerPromise,
  HandlerWithBody,
  HandlerWithoutBody,
  RejectFunction,
  ResolveFunction,
  ResolveOptions,
  ResolveOrReject,
  EmptyParams,
} from "./typings/router";
export * from "./typings/router";

function rejectFactory(response: Response): RejectFunction {
  return function reject(error: WebError): HandlerPromise {
    if (error.parentError) {
      response.req.private.error = error.parentError;
    }
    response.status(error.httpStatus).json(error.getMessage());
    return Promise.resolve(ResolveOrReject.REJECT);
  };
}

function resolveFactory(response: Response): ResolveFunction {
  return function (
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
      response.redirect(status, value);
    } else if (options.file) {
      if (typeof value !== "string") {
        throw new Error(
          `Unsupported type for image path, excepted string got ${typeof value}`,
        );
      }
      response.status(status);
      response.sendFile(value, { headers });
    } else {
      response.status(status);

      if (headers) {
        response.set(headers);
      }
      if (value) {
        response.json(value);
      } else {
        response.end();
      }
    }
    return Promise.resolve(ResolveOrReject.RESOLVE);
  };
}

export class Router {
  private tracer: Tracer;
  private logger: Logger;
  private router: Express.Router;

  constructor(tracer: Tracer, logger: Logger) {
    this.tracer = tracer;
    this.logger = logger;
    this.router = expressRouter();
  }

  private withBodyResponse<T extends Record<string, unknown>, U>(
    handler: HandlerWithBody<T, U>,
  ) {
    return async (request: Request, response: Response): Promise<void> => {
      const resolve = resolveFactory(response);
      const reject = rejectFactory(response);
      const params = { ...request.query, ...request.params } as T;
      try {
        await handler(
          this.tracer,
          resolve,
          reject,
          params,
          request.body,
          request,
        );
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
    this.router.post(path, jsonParser(), this.withBodyResponse(handler));
  }

  patch<T extends Record<string, unknown>, U>(
    path: string,
    handler: HandlerWithBody<T, U>,
  ): void {
    this.router.patch(path, jsonParser(), this.withBodyResponse(handler));
  }

  delete<T extends Record<string, unknown>, U>(
    path: string,
    handler: HandlerWithBody<T, U>,
  ): void {
    this.router.delete(path, jsonParser(), this.withBodyResponse(handler));
  }

  get<T extends Record<string, unknown> = EmptyParams>(
    path: string,
    handler: HandlerWithoutBody<T>,
  ): void {
    this.router.get(path, async (request: Request, response: Response) => {
      const resolve = resolveFactory(response);
      const reject = rejectFactory(response);
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
    });
  }

  getRouter(): Express.Router {
    return this.router;
  }
}
