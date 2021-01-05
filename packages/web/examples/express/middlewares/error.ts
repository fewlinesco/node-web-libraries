import { Tracer } from "@fwl/tracing";
import { WebError } from "@fwl/web/dist/errors";
import { Middleware } from "@fwl/web/dist/middlewares";
import { Request, Response } from "express";

export function errorMiddleware(tracer: Tracer): Middleware<Request, Response> {
  return (handler) => {
    return function (request: Request, response: Response) {
      return tracer.span("error-middleware", async () => {
        try {
          return await handler(request, response);
        } catch (error) {
          if (error instanceof WebError) {
            response.statusCode = error.httpStatus;
            response.setHeader("Content-Type", "application/json");
            return response.end(JSON.stringify(error.getMessage()));
          }

          throw error;
        }
      });
    };
  };
}
