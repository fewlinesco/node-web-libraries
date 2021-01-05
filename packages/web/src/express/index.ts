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

type ExpressMidleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: NextFunction,
) => void;

export function convertMiddleware(middleware: ExpressMidleware): Middleware {
  return (handler: Handler) => {
    return (request: IncomingMessage, response: ServerResponse) => {
      middleware(request, response, () => {
        handler(request, response);
      });
    };
  };
}
