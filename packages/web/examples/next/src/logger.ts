import { createLogger, EncoderTypeEnum } from "@fwl/logging";

const logger = createLogger({
  service: "test-next-app",
  encoder: EncoderTypeEnum.JSON,
});

export default logger;
