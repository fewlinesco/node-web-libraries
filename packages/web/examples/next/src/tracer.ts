import { getTracer, startTracer, Tracer } from "@fwl/tracing";

startTracer({
  simpleCollector: {
    serviceName: "test-next-app",
    url: "http://localhost:55681/v1/traces",
  },
});

export default function (): Tracer {
  return getTracer();
}
