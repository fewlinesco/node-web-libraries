import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { HttpStatus } from "../http-statuses";
import { Middleware } from "../typings/middleware";

export function recoveryMiddleware(tracer: Tracer): Middleware {
  return (handler) => {
    return function (request: IncomingMessage, response: ServerResponse) {
      return tracer.span("recovery middleware", async () => {
        try {
          return await handler(request, response);
        } catch (error) {
          response.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          return response.end();
        }
      });
    };
  };
}
