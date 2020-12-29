import { Tracer } from "@fwl/tracing";
import { NextFunction, Request, Response } from "express";

import { UnauthorizedError } from "../../src/errors";
import { rejectFactory, Middleware } from "../../src/router";

export function authMiddleware(tracer: Tracer): Middleware {
  return function (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    tracer.span<void>("auth-middleware", async () => {
      if (!request.header("Authorization")) {
        const error = UnauthorizedError(
          new Error("Missing Authorization header"),
        );
        rejectFactory(request, response)(error);
        return;
      } else {
        next();
      }
    });
  };
}
