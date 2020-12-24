import { createLogger, EncoderTypeEnum } from "@fwl/logging";
import { startTracer, getTracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

const logger = createLogger({
  service: "next-app",
  encoder: EncoderTypeEnum.JSON,
});

startTracer(
  {
    serviceName: "next-app",
    url: "http://localhost:9411/api/v2/spans",
  },
  logger,
);

export function withTracing<T = unknown>(
  handler: (request: IncomingMessage, response: ServerResponse) => Promise<T>,
): (request: IncomingMessage, response: ServerResponse) => Promise<T> {
  const tracer = getTracer();
  let rootSpan;

  return async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<T> => {
    try {
      const method = request.method;
      rootSpan = await tracer.createRootSpan(`${method} ${request.url}`);

      const nextHandler = await handler(request, response);
      rootSpan.end();
      return nextHandler;
    } catch (error) {
      rootSpan.end();

      throw error;
    }
  };
}
