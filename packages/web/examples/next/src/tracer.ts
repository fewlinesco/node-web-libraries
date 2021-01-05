import { getTracer, startTracer, Tracer } from "@fwl/tracing";

startTracer({
  serviceName: "test-next-app",
  url: "http://localhost:9411/api/v2/spans",
});

export default function (): Tracer {
  return getTracer();
}
