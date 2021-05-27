import { createLogger, EncoderTypeEnum } from "@fwl/logging";
import { startTracer, getTracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

const logger = createLogger({
  service: "next-app",
  encoder: EncoderTypeEnum.JSON,
});

startTracer(
  {
    collectors: [
      {
        type: "otel",
        serviceName: "next-app",
        url: "http://localhost:29799/v1/traces",
      },
      // activate the lightstep developer mode to see this trace
      {
        type: "otel",
        serviceName: "next-app",
        url: "http://localhost:8360/api/v2/otel/trace",
        authorizationHeader: {
          key: "Lightstep-Access-Token",
          value: "developer",
        },
      },
    ],
  },
  logger,
);

export function withTracing<T = unknown>(
  handler: (request: IncomingMessage, response: ServerResponse) => Promise<T>,
): (request: IncomingMessage, response: ServerResponse) => Promise<T> {
  const tracer = getTracer();

  return async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<T> => {
    const method = request.method;
    return tracer.withSpan(`${method} ${request.url}`, async () => {
      const nextHandler = await handler(request, response);

      return nextHandler;
    });
  };
}
