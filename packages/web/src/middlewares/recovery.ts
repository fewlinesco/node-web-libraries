import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { HttpStatus } from "../http-statuses";
import { Middleware } from "../typings/middleware";

export function recoveryMiddleware<
  T extends IncomingMessage,
  U extends ServerResponse
>(tracer: Tracer): Middleware<T, U> {
  return function withFwlRecoveryErrorHandler(handler) {
    return async function (request: T, response: U) {
      try {
        return await handler(request, response);
      } catch (error) {
        const startTime = process.hrtime.bigint();

        const span = tracer.getCurrentSpan();
        span.setDisclosedAttribute("error", true);
        span.setDisclosedAttribute("internal.error", true);
        span.setDisclosedAttribute("http.status_code_group", "5xx");
        if (error instanceof Error) {
          span.setDisclosedAttribute("exception.class", error.toString());
          span.setDisclosedAttribute("exception.message", error.message);
          span.setDisclosedAttribute("stack_trace_hash", error.stack);
        } else {
          span.setDisclosedAttribute("exception.class", error.toString());
        }
        response.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

        const endTime = process.hrtime.bigint();
        const duration = ((endTime - startTime) / BigInt(1000000)).toString();
        span.setDisclosedAttribute(
          "middlewares.recovery.duration_in_ms",
          duration,
        );

        response.end();
        if (handler["__nextjs"]) {
          return { props: {} };
        }

        return;
      }
    };
  };
}
