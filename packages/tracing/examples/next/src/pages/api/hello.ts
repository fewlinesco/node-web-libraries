// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getTracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";

import { withTracing } from "../../middlewares/tracing";

async function handler(
  _request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const tracer = getTracer();

  tracer.span("hello handler", async (span) => {
    response.statusCode = 200;
    response.end(
      `See the trace at http://localhost:29797/trace/${span.getTraceId()}\n`,
    );
  });
}

function wrapMiddlewares(
  middlewares,
  handler,
): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
  for (const middleware of middlewares.reverse()) {
    handler = middleware(handler);
  }

  return handler;
}

export default wrapMiddlewares([withTracing], handler);
