import { createLogger, EncoderTypeEnum } from "@fwl/logging";
import { InMemoryTracer } from "@fwl/tracing";

import * as server from "./server";

const logger = createLogger({
  service: "fwl-sparta-api",
  encoder: EncoderTypeEnum.JSON,
});
const tracer = new InMemoryTracer();

const applicationServer = server.start(tracer, logger);

applicationServer.listen(3000, () => {
  logger.log(`Server started on http://localhost:3000`);
});
