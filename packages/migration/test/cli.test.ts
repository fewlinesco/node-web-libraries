import { runCLI, ERRORS } from "../cli";

describe("runCLI", () => {
  it("handles no arguments", async (done) => {
    expect.assertions(1);

    process.argv = ["", ""];

    try {
      await runCLI();
    } catch (error) {
      expect(error.message).toBe(ERRORS.default.list);
    }

    done();
  });

  describe("--migrate", () => {
    const migrateArgs = ["", "", "--migrate", "path/migration/dir"];

    it("handles too many arguments", async (done) => {
      expect.assertions(1);

      process.argv = [...migrateArgs, "foo"];

      try {
        await runCLI();
      } catch (error) {
        expect(error.message).toBe(ERRORS.migrate.tooManyArgs);
      }

      done();
    });
  });

  describe("--create", () => {
    const createArgs = ["", "", "--create", "foo"];

    it("handles too many arguments", async (done) => {
      expect.assertions(1);

      process.argv = [...createArgs, "bar"];

      try {
        await runCLI();
      } catch (error) {
        expect(error.message).toBe(ERRORS.create.tooManyArgs);
      }

      done();
    });
  });
});
