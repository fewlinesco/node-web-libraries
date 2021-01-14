import "./tracing";
import { getTracer, startTracer } from "@fwl/tracing";
import express from "express";

startTracer({
  lightstepPublicSatelliteCollector: {
    serviceName: "express-server",
    accessToken: "",
    url: "http://localhost:8360/api/v2/otel/trace",
  },
});

const app = express();

const tracer = getTracer();
function tracerMiddleware(request, response, next): void {
  const span = tracer.createSpan("middleware tracing");
  response.on("finish", () => {
    console.log("end createSpan");
    span.end();
  });
  next();
}

app.get("/", tracerMiddleware, async (request, response) => {
  tracer.span("mySpan", async (span) => {
    span.setDisclosedAttribute("attribute", "value");
    tracer.span("anotherSpan", async () => {
      response.send("OK");
    });
  });
});

app.listen(3000, () => console.log("server started"));
