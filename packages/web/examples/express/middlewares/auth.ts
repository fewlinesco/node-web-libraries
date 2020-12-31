import { Tracer } from "@fwl/tracing";
import { UnauthorizedError } from "@fwl/web/dist/errors";
import { Middleware } from "@fwl/web/dist/middlewares";
import { Request, Response } from "express";

export function authMiddleware(tracer: Tracer): Middleware<Request, Response> {
  return (handler) => {
    return function (request: Request, response: Response) {
      return tracer.span<void>("auth-middleware", async () => {
        if (!request.header("Authorization")) {
          const error = UnauthorizedError(
            new Error("Missing Authorization header"),
          );
          throw error;
        } else {
          return handler(request, response);
        }
      });
    };
  };
}
