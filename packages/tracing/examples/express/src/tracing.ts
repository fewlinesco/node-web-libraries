// src/tracing.ts
import { startTracer } from "@fwl/tracing";

startTracer({
  serviceName: "express-server",
  url: "http://localhost:9411/api/v2/spans",
});
