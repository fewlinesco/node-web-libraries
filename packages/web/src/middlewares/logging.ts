import { Logger } from "@fewlines/fwl-logging";
import { Tracer, Span } from "@fewlines/fwl-tracing";
import { NextFunction, Request, Response } from "express";

type Middleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => void;

export function loggingMiddleware(tracer: Tracer, logger: Logger): Middleware {
  function onFinishFactory(span: Span, startTime: bigint): () => void {
    return function onFinish(): void {
      const response = this as Response;
      response.removeListener("finish", onFinish);
      const end = process.hrtime.bigint();

      logger.log("", {
        path: response.req.path,
        remoteaddr:
          response.req.headers["x-forwarded-for"] ||
          response.req.connection.remoteAddress,
        method: response.req.method,
        statusCode: response.statusCode,
        duration: (end - startTime) / BigInt(1000),
        traceid: span.context().traceId,
      });
      span.end();
    };
  }
  return function (
    _request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const startTime = process.hrtime.bigint();
    const span = tracer.createSpan("logging middleware");
    response.once("finish", onFinishFactory(span, startTime));
    next();
  };
}
