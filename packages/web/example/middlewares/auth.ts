import { NextFunction, Request, Response } from "express";

import { UnauthorizedError } from "../../src/errors";
import { rejectFactory, Middleware } from "../../src/router";

export function authMiddleware(): Middleware {
  return function (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    if (!request.header("Authorization")) {
      const error = UnauthorizedError(
        new Error("Missing Authorization header"),
      );
      rejectFactory(response)(error);
      return;
    } else {
      next();
    }
  };
}
