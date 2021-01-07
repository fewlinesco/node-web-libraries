import { Tracer } from "@fwl/tracing";
import { Application, Response, Request, NextFunction } from "express";
import { IncomingMessage, ServerResponse } from "http";

import { Router } from "../../index";
import { Middleware } from "../../middlewares";
import { Handler } from "../typings/handler";

export function createApp(
  newApplication: Application,
  routers: Router<Request, Response>[],
): Application {
  routers.forEach((router) => {
    const routes = router.getRoutes();
    Object.entries(routes).forEach(([path, pathHandlers]) => {
      Object.entries(pathHandlers).forEach(([method, handler]) => {
        newApplication[method](path, handler);
      });
    });
  });
  return newApplication;
}

type ExpressMiddleware<T extends IncomingMessage, U extends ServerResponse> = (
  request: T,
  response: U,
  next: NextFunction,
) => void;

export function convertMiddleware<
  T extends IncomingMessage,
  U extends ServerResponse
>(tracer: Tracer, middleware: ExpressMiddleware<T, U>): Middleware<T, U> {
  return (handler: Handler<T, U>) => {
    return (request: T, response: U) => {
      return new Promise((resolve, reject) => {
        tracer.span(`Converted Middleware: ${middleware.name}`, async () => {
          middleware(request, response, async () => {
            try {
              const result = await handler(request, response);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
        });
      });
    };
  };
}
