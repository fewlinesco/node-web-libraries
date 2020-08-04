import { NextFunction, Request, Response, RequestHandler } from "express";

export function extendRequestMiddleware(): RequestHandler {
  return function (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    request.private = {};
    next();
  };
}
