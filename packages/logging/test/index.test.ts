import { createLogger } from "../index";

const spy = jest.spyOn(process.stdout, "write");
afterAll(() => spy.mockRestore());
beforeEach(() => spy.mockReset());

describe("Key Value Logger", () => {
  test("Should log", () => {
    const logger = createLogger("service-name");
    logger.log("test message");

    expect(spy).toHaveBeenCalledWith(
      `service=service-name message="test message"\n`,
    );
  });

  test("Should log with additionnal metadata", () => {
    const logger = createLogger("service-name");
    const enhancedLogger = logger.withMeta({ user: 1 });
    enhancedLogger.log("test message");

    expect(spy).toHaveBeenCalledWith(
      `service=service-name user=1 message="test message"\n`,
    );
  });
});

describe("JSON Logger", () => {
  test("Should log", () => {
    const logger = createLogger("service-name", "json");
    logger.log("test message");

    expect(spy).toHaveBeenCalledWith(
      JSON.stringify({
        service: "service-name",
        message: "test message",
      }) + "\n",
    );
  });

  test("Should log with additionnal metadata", () => {
    const logger = createLogger("service-name", "json");
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
