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
      const startTime = process.hrtime.bigint();

      return new Promise((resolve, reject) => {
        const span = tracer.getCurrentSpan();

        middleware(request, response, async () => {
          try {
            const result = await handler(request, response);

            const endTime = process.hrtime.bigint();
            const duration = (
              (endTime - startTime) /
              BigInt(1000000)
            ).toString();
            span.setDisclosedAttribute(
              `middlewares.${middleware.name}.duration_in_ms`,
              duration,
            );

            resolve(result);
          } catch (error) {
            const endTime = process.hrtime.bigint();
            const duration = (
              (endTime - startTime) /
              BigInt(1000000)
            ).toString();
            span.setDisclosedAttribute(
              `middlewares.${middleware.name}.duration_in_ms`,
              duration,
            );
            span.setDisclosedAttribute(
              `middlewares.${middleware.name}.error`,
              true,
            );

            if (error instanceof Error) {
              span.setDisclosedAttribute(
                `middlewares.${middleware.name}.exception.class`,
                error.toString(),
              );
              span.setDisclosedAttribute(
                `middlewares.${middleware.name}.exception.message`,
                error.message,
              );
              span.setDisclosedAttribute(
                `middlewares.${middleware.name}.stack_trace_hash`,
                error.stack,
              );
            } else {
              span.setDisclosedAttribute(
                `middlewares.${middleware.name}.exception.class`,
                error.toString(),
              );
            }

            reject(error);
          }
        });
      });
    };
  };
}
