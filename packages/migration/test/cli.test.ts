import * as fs from "fs";
import * as migration from "../migration";
import * as path from "path";
import { getConfig } from "../utils/getConfig";

import { runCLI } from "../cli";
import { createMigrationFile } from "../index";

describe("runCLI", () => {
  it("handles no arguments", async (done) => {
    expect.assertions(6);

    process.argv = ["", ""];

    const mockExit = jest.spyOn(process, 'exit')
      .mockImplementation(
        (code?: number) => {
          expect(code).not.toBe(0);
          throw new Error("failed in mock implementation");
        }
      );
    const mockLog = jest.spyOn(console, 'log')
    const mockError = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await runCLI();
    } catch (err) {
      expect(err.message).toBe("failed in mock implementation");
      expect(mockExit).toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalledWith(0);
      expect(mockLog).not.toHaveBeenCalled()
      expect(mockError).toHaveBeenCalledWith("Not enough non-option arguments: got 0, need at least 1")
    }

    mockExit.mockRestore()
    mockLog.mockRestore()
    done();
  });

  describe("migrate", () => {
    const migrateArgs = ["", "", "migrate", "path/migration/dir"];

    it("handles too many arguments", async (done) => {
      expect.assertions(6);

      const spyMigrate = jest.spyOn(migration, 'runMigrations')
      const mockExit = jest.spyOn(process, 'exit')
        .mockImplementation(
          (code?: number) => {
            expect(code).not.toBe(0);
            throw new Error("failed in mock implementation");
          }
        );
      const mockLog = jest.spyOn(console, 'log')


      process.argv = [...migrateArgs, "foo"];

      try {
         await runCLI();
      } catch (error) {
        expect(spyMigrate).not.toHaveBeenCalled()
        expect(error.message).toBe("failed in mock implementation");
        expect(mockExit).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalledWith(0);
        expect(mockLog).not.toHaveBeenCalled()
      }


      mockExit.mockRestore()
      mockLog.mockRestore()

      done();
    });
  });

  describe("--create", () => {
    const createArgs = ["", "", "create", "foo"];

    it("creates a timestamped migration file", async (done) => {
      expect.assertions(1);

      process.argv = [...createArgs, "foo"];

      const config = await getConfig("./test/config.json")
      const createdMigrationFile = await createMigrationFile("foo", config.migration.dirPath);

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

      const spyCreate =
        jest
          .spyOn(migration, 'createMigrationFile')
          .mockImplementation((name: string, migrationPath?: string) => Promise.resolve(name))
      const mockExit = jest.spyOn(process, 'exit')
        .mockImplementation(
          (code?: number) => {
            expect(code).not.toBe(0);
            throw new Error("failed in mock implementation");
          }
        );
      const mockLog = jest.spyOn(console, 'log')
      const mockError = jest.spyOn(console, 'error').mockImplementation(() => {})

      process.argv = [...createArgs, "bar"];

      try {
        await runCLI();
      } catch (error) {
        expect(spyCreate).not.toHaveBeenCalled()
        expect(error.message).toBe("failed in mock implementation");
        expect(mockExit).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalledWith(0);
        expect(mockLog).not.toHaveBeenCalled()
        expect
      }

      done();
    });
  });

  // describe("--dry-run", () => {
  //   const migrateArgs = ["", "", "--dry-run", "path/migration/dir"];

  //   it("handles too many arguments", async (done) => {
  //     expect.assertions(1);

  //     process.argv = [...migrateArgs, "foo"];

  //     try {
  //       await runCLI();
  //     } catch (error) {
  //       expect(error.message).toBe(ERRORS.dryRun.tooManyArgs);
  //     }

  //     done();
  //   });
  // });
});
