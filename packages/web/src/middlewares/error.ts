import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { WebError } from "../errors";
import { Middleware } from "../typings/middleware";

export function errorMiddleware<
  T extends IncomingMessage,
  U extends ServerResponse
>(tracer: Tracer): Middleware<T, U> {
  return function withFwlErrorHandler(handler) {
    return function (request: T, response: U) {
      return tracer.span("error middleware", async (span) => {
        try {
          return await handler(request, response);
        } catch (error) {
          if (error instanceof WebError) {
            span.setDisclosedAttribute("client.error", true);
            span.setDisclosedAttribute("http.status_code", error.httpStatus);
            span.setDisclosedAttribute(
              "http.status_code_group",
              error.httpStatus.toString()[0] + "xx",
            );
            span.setDisclosedAttribute("exception.class", error.toString());
            span.setDisclosedAttribute("exception.message", error.message);
            span.setDisclosedAttribute(
              "unified_error_code",
              error.applicationStatus,
            );
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