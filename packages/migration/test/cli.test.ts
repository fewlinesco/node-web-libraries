import { runCLI, ERRORS } from "../cli";

describe("runCLI", () => {
  it("handles no arguments", async (done) => {
    expect.assertions(1);

    process.argv = ["", ""];

    expect(await runCLI()).toThrowError(ERRORS.default.list);

    done();
  });

  describe("--migrate", () => {
    process.argv = ["", "", "--migrate", "path/migration/dir"];

    it("handles too many arguments", async (done) => {
      expect.assertions(1);

      process.argv = [...process.argv, "foo"];

      expect(await runCLI()).toThrowError(ERRORS.migrate.tooManyArgs);

      done();
    });
  });

  describe("--create", () => {
    process.argv = ["", "", "--create", "foo"];

    it("handles too many arguments", async (done) => {
      expect.assertions(1);

      process.argv = [...process.argv, "bar"];

      expect(await runCLI()).toThrowError(ERRORS.create.tooManyArgs);

      done();
    });
  });
});
