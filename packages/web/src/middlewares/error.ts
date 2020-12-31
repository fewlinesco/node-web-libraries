import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { WebError } from "../errors";
import { Middleware } from "../typings/middleware";

export function errorMiddleware(tracer: Tracer): Middleware {
  return (handler) => {
    return function (request: IncomingMessage, response: ServerResponse) {
      return tracer.span("error middleware", async () => {
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
