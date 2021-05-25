import { createLogger, EncoderTypeEnum } from "@fwl/logging";
import { startTracer, getTracer, Span } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

const logger = createLogger({
  service: "next-app",
  encoder: EncoderTypeEnum.JSON,
});

startTracer(
  {
    simpleCollector: {
      serviceName: "next-app",
      url: "http://localhost:29799/v1/traces",
    },
  },
  logger,
);

export function withTracing<T = unknown>(
  handler: (request: IncomingMessage, response: ServerResponse) => Promise<T>,
): (request: IncomingMessage, response: ServerResponse) => Promise<T> {
  const tracer = getTracer();
  let rootSpan: Span;

  return async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<T> => {
    try {
      const method = request.method;
      rootSpan = tracer.createSpan(`${method} ${request.url}`);

      const nextHandler = await handler(request, response);
      rootSpan.end();
      return nextHandler;
    } catch (error) {
      rootSpan.end();

      throw error;
    }
  };
}
