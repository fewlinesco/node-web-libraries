import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { Middleware } from "../typings/middleware";

function tracingMiddleware<T extends IncomingMessage, U extends ServerResponse>(
  tracer: Tracer,
): Middleware<T, U> {
  return (handler) => {
    return async function (request: T, response: U) {
      const displayedName = handler["__route"]
        ? handler["__route"]
        : request.url;
      const spanName = `${request.method || "GET"} ${displayedName}`;

      return tracer.withSpan(spanName, async (span) => {
        const result = await handler(request, response);
        span.setDisclosedAttribute("http.status_code", response.statusCode);
        span.setDisclosedAttribute("http.target", request.headers.host);
        span.setDisclosedAttribute("http.url", request.url);

        return result;
      });
    };
  };
}

export { tracingMiddleware };
