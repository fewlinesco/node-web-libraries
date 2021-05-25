import { InMemoryLogger } from "../src/in-memory-logger";

const spy = jest.spyOn(console, "log");
afterAll(() => spy.mockRestore());
beforeEach(() => spy.mockReset());

describe("InMemoryLogger", () => {
  it("Should not call 'console.log'", () => {
    expect.assertions(1);

    const logger = new InMemoryLogger({
      service: "service-name",
    });
    logger.log("foo");

    expect(spy).not.toHaveBeenCalledWith(
      `service=service-name message="foo"\n`,
    );
  });

  it("Should store logs", () => {
    expect.assertions(2);

    const logger = new InMemoryLogger({
      service: "service-name",
    });
    logger.log("foo");
    logger.log("bar");

    expect(logger.getLog(0)).toStrictEqual({
      message: "foo",
      service: "service-name",
    });
    expect(logger.getLog(1)).toStrictEqual({
      message: "bar",
      service: "service-name",
    });
  });
});
