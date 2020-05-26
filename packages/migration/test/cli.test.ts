import * as fs from "fs";
import * as path from "path";

import { runCLI, ERRORS } from "../cli";
import { createMigrationFile } from "../index";
import { createTimestamp } from "../utils/createTimestamp";

jest.mock("../utils/getConfig", () => {
  const cleanConfigPath = path.join(process.cwd(), "./test/config.json");

  return {
    getConfig: async () =>
      await fs.promises
        .readFile(path.join(cleanConfigPath), "utf-8")
        .then(JSON.parse),
  };
});

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

    it("create a timestamped migration file", async (done) => {
      expect.assertions(1);

      process.argv = [...createArgs, "foo"];
      await createMigrationFile("foo");

      const migrationsDirPath = path.join(process.cwd(), "/test/migrations");

      const createdMigrationFile = await fs.promises.readdir(migrationsDirPath);

      const expectedFile = `${createTimestamp(new Date())}-foo.sql`;

      expect(createdMigrationFile[createdMigrationFile.length - 1]).toBe(
        expectedFile,
      );

      await fs.promises.unlink(`${migrationsDirPath}/${expectedFile}`);

      done();
    });

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
