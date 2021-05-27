// src/tracing.ts
import { startTracer } from "@fwl/tracing";

startTracer({
  simpleCollector: {
    serviceName: "next-app",
    url: "http://localhost:29799/v1/traces",
  },
});
