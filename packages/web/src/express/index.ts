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
>(middleware: ExpressMiddleware<T, U>): Middleware<T, U> {
  return (handler: Handler<T, U>) => {
    return (request: T, response: U) => {
      middleware(request, response, () => {
        handler(request, response);
      });
    };
  };
}
