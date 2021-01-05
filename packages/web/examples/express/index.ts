import { createLogger } from "@fewlines/fwl-logging";
import { InMemoryTracer } from "@fwl/tracing";

import * as server from "./server";

const logger = createLogger("fwl-sparta-api", "json");
const tracer = new InMemoryTracer();

const applicationServer = server.start(tracer, logger);

applicationServer.listen(3000, () => {
  logger.log(`Server started on http://localhost:3000`);
});
