import { Logger } from "@fwl/logging";
import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { HttpStatus } from "../http-statuses";
import { Middleware } from "../typings/middleware";

function getAddr(request: IncomingMessage): string {
  if (request.headers["x-forwarded-for"]) {
    return request.headers["x-forwarded-for"].toString();
  } else if (request.socket.remoteAddress) {
    return request.socket.remoteAddress.toString();
  }
  return "";
}

function logAttributes(
  duration: string,
  request: IncomingMessage,
  statusCode: HttpStatus,
  traceId: string,
): Record<string, string | number> {
  return {
    duration,
    method: request.method ? request.method : "Undefined method",
    path: request.url ? request.url : "Undefined request URL",
    remoteaddr: getAddr(request),
    statusCode: statusCode || 500,
    traceid: traceId,
  };
}

function loggingMiddleware<T extends IncomingMessage, U extends ServerResponse>(
  tracer: Tracer,
  logger: Logger,
): Middleware<T, U> {
  return function withFwlLoggingHandler(handler) {
    return async (request: T, response: U) => {
      const span = tracer.getCurrentSpan();

      const startTime = process.hrtime.bigint();
      try {
        const result = await handler(request, response);
        const endTime = process.hrtime.bigint();
        const duration = ((endTime - startTime) / BigInt(1000000)).toString();
        logger.log(
          "",
          logAttributes(
            duration,
            request,
            response.statusCode,
            span.getTraceId(),
          ),
        );

        span.setDisclosedAttribute(
          "middlewares.logging.duration_in_ms",
          duration,
        );

        return result;
      } catch (error) {
        const statusCode = error.httpStatus || HttpStatus.INTERNAL_SERVER_ERROR;

        const endTime = process.hrtime.bigint();
        const duration = ((endTime - startTime) / BigInt(1000000)).toString();
        logger.log(
          error.toString(),
          logAttributes(duration, request, statusCode, span.getTraceId()),
        );
        span.setDisclosedAttribute(
          "middlewares.logging.duration_in_ms",
          duration,
        );

        throw error;
      }
    };
  };
}

export { loggingMiddleware };
