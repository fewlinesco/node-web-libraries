import { getTracer, startTracer } from "@fwl/tracing";
import express from "express";

startTracer({
  collectors: [
    {
      type: "otel",
      serviceName: "express-server",
      url: "http://localhost:21098/v1/traces",
    },
    // activate the lightstep developer mode to see this trace
    {
      type: "otel",
      serviceName: "express-server",
      url: "http://localhost:8360/api/v2/otel/trace",
      authorizationHeader: {
        key: "Lightstep-Access-Token",
        value: "developer",
      },
    },
  ],
});

const app = express();

const tracer = getTracer();
function tracerMiddleware(request, response, next): void {
  tracer.withSpan(`HTTP ${request.method} /`, async () => {
    const span = tracer.createSpan("tracing middleware");
    response.on("finish", () => {
      span.end();
    });
    next();
  });
}

app.get("/", tracerMiddleware, async (request, response) => {
  tracer.span("mySpan", async (span) => {
    span.setDisclosedAttribute("attribute", "value");
    tracer.span("anotherSpan", async (span) => {
      response.send(
        `See span result at http://localhost:21096/trace/${span.getTraceId()}\n`,
      );
    });
  });
});

app.listen(3000, () => console.log("server started"));
