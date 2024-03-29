import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { WebError } from "../errors";
import { Middleware } from "../typings/middleware";

function errorMiddleware<T extends IncomingMessage, U extends ServerResponse>(
  tracer: Tracer,
): Middleware<T, U> {
  return function withFwlErrorHandler(handler) {
    return async function (request: T, response: U) {
      try {
        return await handler(request, response);
      } catch (error) {
        if (error instanceof WebError) {
          const startTime = process.hrtime.bigint();

          const span = tracer.getCurrentSpan();

          span.setDisclosedAttribute("client.error", true);
          span.setDisclosedAttribute("http.status_code", error.httpStatus);
          span.setDisclosedAttribute(
            "http.status_code_group",
            error.httpStatus.toString()[0] + "xx",
          );
          span.setDisclosedAttribute("exception.class", error.getClassName());
          span.setDisclosedAttribute("exception.message", error.toString());
          span.setDisclosedAttribute(
            "unified_error_code",
            error.applicationStatus,
          );
          response.statusCode = error.httpStatus;
          response.setHeader("Content-Type", "application/json");

          const endTime = process.hrtime.bigint();
          const duration = ((endTime - startTime) / BigInt(1000000)).toString();
          span.setDisclosedAttribute(
            "middlewares.error.duration_in_ms",
            duration,
          );

          response.end(JSON.stringify(error.getMessage()));

          if (handler["__nextjs"]) {
            return response.statusCode === 404
              ? {
                  notFound: true,
                }
              : { props: {} };
          }

          return;
        }

        throw error;
      }
    };
  };
}

export { errorMiddleware };
