// @ts-nocheck
import { createLogger } from "@fewlines/fwl-logging";
import { InMemoryTracer } from "@fwl/tracing";
// import { monitoringServer } from "@fwl/web";

import * as server from "./server";

const logger = createLogger("fwl-sparta-api");
const tracer = new InMemoryTracer();

const applicationServer = server.application.start(tracer, logger);

applicationServer.listen(3000, () => {
  logger.log(`Server started on http://localhost:3000`);
  monitoringServer.start(tracer, logger).listen(3001);
});
