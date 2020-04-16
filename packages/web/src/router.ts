import { Router as expressRouter, Request, Response } from "express";
import { json as jsonParser } from "body-parser";
import * as Express from "express-serve-static-core";
import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fewlines/fwl-tracing";
import { HttpStatus } from "./http-statuses";
import { UnmanagedError, WebError } from "./errors";

export interface Params {
  [key: string]: unknown;
}

enum ResolveOrReject {
  RESOLVE,
  REJECT,
}

export type HandlerPromise = Promise<ResolveOrReject>;

export type RejectFunction = (error: WebError) => HandlerPromise;

export type ResolveFunction = (
  status: HttpStatus,
  returnValue?: unknown,
) => HandlerPromise;

type Handler = (
  tracer: Tracer,
  resolve: ResolveFunction,
  reject: RejectFunction,
  params: Params,
  request: Request,
) => HandlerPromise;

function rejectFactory(response: Response): RejectFunction {
  return function reject(error: WebError): HandlerPromise {
    response.status(error.httpStatus).json(error.getMessage());
    return Promise.resolve(ResolveOrReject.REJECT);
  };
}

function resolveFactory(response: Response): ResolveFunction {
  return function resolve(
    status: HttpStatus,
    returnValue?: unknown,
  ): HandlerPromise {
    response.status(status);
    if (returnValue && typeof returnValue === "string") {
      response.send(returnValue);
    } else if (returnValue) {
      response.json(returnValue);
    } else {
      response.end();
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

  private withBodyResponse(handler: Handler) {
    return async (request, response): Promise<void> => {
      const resolve = resolveFactory(response);
      const reject = rejectFactory(response);
      const params = { ...request.query, ...request.params, ...request.body };
      try {
        await handler(this.tracer, resolve, reject, params, request);
      } catch (exception) {
        if (exception instanceof WebError) {
          reject(exception);
        } else {
          reject(UnmanagedError());
        }
      }
    };
  }

  post(path: string, handler: Handler): void {
    this.router.post(path, jsonParser(), this.withBodyResponse(handler));
  }

  patch(path: string, handler: Handler): void {
    this.router.patch(path, jsonParser(), this.withBodyResponse(handler));
  }

  delete(path: string, handler: Handler): void {
    this.router.patch(path, jsonParser(), this.withBodyResponse(handler));
  }

  get(path: string, handler: Handler): void {
    this.router.get(path, async (request, response) => {
      const resolve = resolveFactory(response);
      const reject = rejectFactory(response);
      const params = { ...request.query, ...request.params };
      try {
        await handler(this.tracer, resolve, reject, params, request);
      } catch (exception) {
        if (exception instanceof WebError) {
          reject(exception);
        } else {
          reject(UnmanagedError());
        }
      }
    });
  }

  getRouter(): Express.Router {
    return this.router;
  }
}
