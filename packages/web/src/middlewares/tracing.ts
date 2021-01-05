import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { Middleware } from "../typings/middleware";

export function tracingMiddleware<
  T extends IncomingMessage,
  U extends ServerResponse
>(tracer: Tracer): Middleware<T, U> {
  return (handler) => {
    return async function (request: T, response: U) {
      const spanName = `${request.method || "GET"} ${request.url}`;
      const span = tracer.createRootSpan(spanName);
      const result = await handler(request, response);
      span.setDisclosedAttribute("http.status_code", response.statusCode);
      span.end();
      return result;
    };
  };
}
