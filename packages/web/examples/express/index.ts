import { createLogger, EncoderTypeEnum } from "@fwl/logging";
import { getTracer, startTracer } from "@fwl/tracing";

import * as server from "./server";

const logger = createLogger({
  service: "fwl-sparta-api",
  encoder: EncoderTypeEnum.JSON,
});
startTracer({
  simpleCollector: {
    serviceName: "test-express-app",
    url: "http://localhost:55681/v1/traces",
  },
});
const tracer = getTracer();

const applicationServer = server.start(tracer, logger);

applicationServer.listen(3000, () => {
  logger.log(`Server started on http://localhost:3000`);
});
