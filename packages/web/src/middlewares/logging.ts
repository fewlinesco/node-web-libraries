import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { Middleware } from "../typings/middleware";

const logAttributes = (
  startTime: bigint,
  request: IncomingMessage,
  response: ServerResponse,
  traceId: string,
): Record<string, string | number> => {
  const endTime = process.hrtime.bigint();
  return {
    duration: ((endTime - startTime) / BigInt(1000)).toString(),
    method: request.method ? request.method : "Undefined method",
    path: request.url ? request.url : "Undefined request URL",
    remoteaddr: request.headers["x-forwarded-for"]
      ? request.headers["x-forwarded-for"].toString()
      : "",
    statusCode: response.statusCode || 500,
    traceid: traceId,
  };
};

export function withLogging<
  T extends IncomingMessage,
  U extends ServerResponse
>(tracer: Tracer, logger: Logger): Middleware<T, U> {
  return (handler) => async (request: T, response: U) => {
    const startTime = process.hrtime.bigint();
    tracer.span("logging middleware", async (span) => {
      try {
        const result = await handler(request, response);
        logger.log(
          "",
          logAttributes(startTime, request, response, span.context().traceId),
        );
        return result;
      } catch (error) {
        logger.log(
          error.toString(),
          logAttributes(startTime, request, response, span.context().traceId),
        );
        throw error;
      }
    });
  };
}
