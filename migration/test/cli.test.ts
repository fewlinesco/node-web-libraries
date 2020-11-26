import { RunMigrationsConfig } from "config/config";
import * as fs from "fs";
import * as path from "path";

import { runCLI } from "../cli";
import { createMigrationFile } from "../index";
import * as migration from "../migration";
import { getConfig } from "../utils/getConfig";

describe("runCLI", () => {
  it("handles no arguments", async (done) => {
    expect.assertions(6);

    process.argv = ["", ""];

    const mockExit = jest
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        expect(code).not.toBe(0);
        throw new Error("failed in mock implementation");
      });
    const mockLog = jest.spyOn(console, "log");
    const mockError = jest.spyOn(console, "error").mockImplementation(() => {
      return;
    });
    try {
      await runCLI();
    } catch (err) {
      expect(err.message).toBe("failed in mock implementation");
      expect(mockExit).toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalledWith(0);
      expect(mockLog).not.toHaveBeenCalled();
      expect(mockError).toHaveBeenCalledWith(
        "Not enough non-option arguments: got 0, need at least 1",
      );
    }

    mockExit.mockRestore();
    mockLog.mockRestore();
    done();
  });

  describe("migrate", () => {
    const migrateArgs = ["fwl-migration", "migrate"];

    it("handles too many arguments", async (done) => {
      expect.assertions(6);

      const spyMigrate = jest.spyOn(migration, "runMigrations");
      const mockExit = jest
        .spyOn(process, "exit")
        .mockImplementation((code?: number) => {
          expect(code).not.toBe(0);
          throw new Error("failed in mock implementation");
        });
      const mockLog = jest.spyOn(console, "log");

      process.argv = [...migrateArgs, "foo"];

      try {
        await runCLI();
      } catch (error) {
        expect(spyMigrate).not.toHaveBeenCalled();
        expect(error.message).toBe("failed in mock implementation");
        expect(mockExit).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalledWith(0);
        expect(mockLog).not.toHaveBeenCalled();
      }

      mockExit.mockRestore();
      mockLog.mockRestore();

      done();
    });

    it("can override the database table with a database url passed as an option", async (done) => {
      expect.assertions(2)
      const spyMigrate =
        jest
        .spyOn(migration, "runMigrations")
        .mockImplementation((config: RunMigrationsConfig) => {
          expect(config.database).toBe({
            database: "database",
            host: "host",
            password: "password",
            port: 7777,
            username: "user",
          })
          return Promise.resolve()
        })
      process.argv = [...migrateArgs, "--databaseURL", "postgres://user:password@host:7777/database"]
      console.log(process.argv)
      try {
        await runCLI();
      } catch(error) {
        fail(error)
      }
      expect(spyMigrate).toHaveBeenCalled()
    })
  });

  describe("create", () => {
    const createArgs = ["", "", "create", "foo"];

    it("creates a timestamped migration file", async (done) => {
      expect.assertions(1);

      process.argv = [...createArgs];

      const config = await getConfig("./test/config.json");
      const createdMigrationFile = await createMigrationFile(
        "foo",
        config.migration.dirPath,
      );

      const migrationsDirPath = path.join(process.cwd(), "/test/migrations");

      const migrationFiles = await fs.promises.readdir(migrationsDirPath);

      expect(createdMigrationFile).toBe(
        migrationFiles[migrationFiles.length - 1],
      );

      await fs.promises.unlink(`${migrationsDirPath}/${createdMigrationFile}`);

      done();
    });

    it("handles too many arguments", async (done) => {
      expect.assertions(6);

      process.argv = [...createArgs, "foo", "bar", "braz"];

      const spyCreate = jest
        .spyOn(migration, "createMigrationFile")
        .mockImplementation((name: string, _migrationPath?: string) =>
          Promise.resolve(name),
        );
      const mockExit = jest
        .spyOn(process, "exit")
        .mockImplementation((code?: number) => {
          expect(code).not.toBe(0);
          throw new Error("failed in mock implementation");
        });
      const mockLog = jest.spyOn(console, "log");

      process.argv = [...createArgs, "bar"];

      try {
        await runCLI();
      } catch (error) {
        expect(spyCreate).not.toHaveBeenCalled();
        expect(error.message).toBe("failed in mock implementation");
        expect(mockExit).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalledWith(0);
        expect(mockLog).not.toHaveBeenCalled();
      }

      done();
    });
  });

  describe("dryRun", () => {
    const migrateArgs = ["", "", "dryRun", "path/migration/dir"];

    it("handles too many arguments", async (done) => {
      expect.assertions(6);

      process.argv = [...migrateArgs, "foo", "bar", "braz"];

      const spyCreate = jest
        .spyOn(migration, "dryRunPendingMigrations")
        .mockImplementation((_config: RunMigrationsConfig) =>
          Promise.resolve(),
        );
      const mockExit = jest
        .spyOn(process, "exit")
        .mockImplementation((code?: number) => {
          expect(code).not.toBe(0);
          throw new Error("failed in mock implementation");
        });
      const mockLog = jest.spyOn(console, "log");

      process.argv = [...migrateArgs, "bar"];

      try {
        await runCLI();
      } catch (error) {
        expect(spyCreate).not.toHaveBeenCalled();
        expect(error.message).toBe("failed in mock implementation");
        expect(mockExit).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalledWith(0);
        expect(mockLog).not.toHaveBeenCalled();
      }

      done();
    });
  });
});
