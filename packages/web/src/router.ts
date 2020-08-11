import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fwl/tracing";
import { json as jsonParser } from "body-parser";
import {
  Router as expressRouter,
  Request,
  Response,
  NextFunction,
} from "express";
import * as Express from "express-serve-static-core";

import { UnmanagedError, WebError } from "./errors";
import { HttpStatus } from "./http-statuses";

export type EmptyParams = Record<string, unknown>;

export type EmptyBody = Record<string, unknown>;

export type Middleware = (
  req: Request,
  res: Response,
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
  request: Request,
) => HandlerPromise;

export type HandlerWithBody<T, U> = (
  tracer: Tracer,
  resolve: ResolveFunction,
  reject: RejectFunction,
  params: T,
  body: U,
  request: Request,
) => HandlerPromise;

export type HandlerPromise = Promise<ResolveOrReject>;

export type RejectFunction = (error: WebError) => HandlerPromise;

export function rejectFactory(response: Response): RejectFunction {
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
    this.router.get(
      path,
      ...this.middlewares,
      async (request: Request, response: Response) => {
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
      },
    );
  }

  getRouter(): Express.Router {
    return this.router;
  }
}
