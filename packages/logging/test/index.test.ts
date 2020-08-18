import { EncoderTypeEnum } from "../config/config";
import { createLogger } from "../index";

const spy = jest.spyOn(process.stdout, "write");
afterAll(() => spy.mockRestore());
beforeEach(() => spy.mockReset());

describe("Key Value Logger", () => {
  test("Should log", () => {
    const logger = createLogger({
      service: "service-name",
      encoder: EncoderTypeEnum.KV,
    });
    logger.log("test message");

    expect(spy).toHaveBeenCalledWith(
      `service=service-name message="test message"\n`,
    );
  });

  test("Should log with additional metadata", () => {
    const logger = createLogger({
      service: "service-name",
      encoder: EncoderTypeEnum.KV,
    });
    const enhancedLogger = logger.withMeta({ user: 1 });
    enhancedLogger.log("test message");

    expect(spy).toHaveBeenCalledWith(
      `service=service-name user=1 message="test message"\n`,
    );
  });
});

describe("JSON Logger", () => {
  test("Should log", () => {
    const logger = createLogger({
      service: "service-name",
      encoder: EncoderTypeEnum.JSON,
    });
    logger.log("test message");

    expect(spy).toHaveBeenCalledWith(
      JSON.stringify({
        service: "service-name",
        message: "test message",
      }) + "\n",
    );
  });

  test("Should log with additional metadata", () => {
    const logger = createLogger({
      service: "service-name",
      encoder: EncoderTypeEnum.JSON,
    });
    const enhancedLogger = logger.withMeta({ user: 1 });
    enhancedLogger.log("test message");

    expect(spy).toHaveBeenCalledWith(
      JSON.stringify({
        service: "service-name",
        user: 1,
        message: "test message",
      }) + "\n",
    );
  });
});
