import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { HttpStatus } from "../http-statuses";
import { Middleware } from "../typings/middleware";

export function recoveryMiddleware(tracer: Tracer): Middleware {
  return function withFwlRecoveryErrorHandler(handler) {
    return function (request: IncomingMessage, response: ServerResponse) {
      return tracer.span("recovery middleware", async (span) => {
        try {
          return await handler(request, response);
        } catch (error) {
          span.setDisclosedAttribute("error", true);
          if (error instanceof Error) {
            span.setDisclosedAttribute("error.message", error.message);
            span.setDisclosedAttribute("error.stacktrace", error.stack);
          }
          response.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          return response.end();
        }
      });
    };
  };
}
