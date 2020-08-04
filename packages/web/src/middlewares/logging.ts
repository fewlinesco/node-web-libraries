import { Logger } from "@fewlines/fwl-logging";
import { Tracer, Span } from "@fwl/tracing";
import { NextFunction, Request, Response, RequestHandler } from "express";

export function loggingMiddleware(
  tracer: Tracer,
  logger: Logger,
): RequestHandler {
  function onFinishFactory(
    span: Span,
    startTime: bigint,
    request: Request,
  ): () => void {
    return function onFinish(): void {
      const response = this as Response;
      response.removeListener("finish", onFinish);

      const end = process.hrtime.bigint();
      const message = request.private.error
        ? (request.private.error as Error).message
        : "";

      logger.log(message, {
        path: response.req.path,
        remoteaddr: (
          response.req.headers["x-forwarded-for"] ||
          response.req.connection.remoteAddress
        ).toString(),
        method: response.req.method,
        statusCode: response.statusCode,
        duration: Number((end - startTime) / BigInt(1000)),
        traceid: span.context().traceId,
      });
      span.end();
    };
  }

  return function (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const startTime = process.hrtime.bigint();
    const span = tracer.createSpan("logging middleware");
    response.once("finish", onFinishFactory(span, startTime, request));
    next();
  };
}
