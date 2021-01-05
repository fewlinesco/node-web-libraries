import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { HttpStatus } from "../http-statuses";
import { Middleware } from "../typings/middleware";

function getAddr(request: IncomingMessage): string {
  if (request.headers["x-forwarded-for"]) {
    return request.headers["x-forwarded-for"].toString();
  } else if (request.connection.remoteAddress) {
    return request.connection.remoteAddress.toString();
  }
  return "";
}

function logAttributes(
  startTime: bigint,
  request: IncomingMessage,
  statusCode: HttpStatus,
  traceId: string,
): Record<string, string | number> {
  const endTime = process.hrtime.bigint();
  return {
    duration: ((endTime - startTime) / BigInt(1000)).toString(),
    method: request.method ? request.method : "Undefined method",
    path: request.url ? request.url : "Undefined request URL",
    remoteaddr: getAddr(request),
    statusCode: statusCode || 500,
    traceid: traceId,
  };
}

export function loggingMiddleware<
  T extends IncomingMessage,
  U extends ServerResponse
>(tracer: Tracer, logger: Logger): Middleware<T, U> {
  return function withFwlLoggingHandler(handler) {
    return async (request: T, response: U) => {
      const startTime = process.hrtime.bigint();
      return tracer.span("logging middleware", async (span) => {
        try {
          const result = await handler(request, response);
          logger.log(
            "",
            logAttributes(
              startTime,
              request,
              response.statusCode,
              span.getTraceId(),
            ),
          );
          return result;
        } catch (error) {
          const statusCode =
            error.httpStatus || HttpStatus.INTERNAL_SERVER_ERROR;
          logger.log(
            error.toString(),
            logAttributes(startTime, request, statusCode, span.getTraceId()),
          );
          throw error;
        }
      });
    };
  };
}
