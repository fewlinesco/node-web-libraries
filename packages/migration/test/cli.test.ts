import { RunMigrationsConfig } from "config/config";
import * as fs from "fs";
import * as path from "path";

import { runCLI } from "../cli";
import { createMigrationFile } from "../index";
import * as migration from "../migration";
import { getConfig } from "../utils/getConfig";

describe("runCLI", () => {
  it("handles no arguments", async () => {
    expect.assertions(6);

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
      await runCLI([]);
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
  });

  describe("migrate", () => {
    it("handles too many arguments", async () => {
      expect.assertions(6);

      const spyMigrate = jest.spyOn(migration, "runMigrations");
      const mockExit = jest
        .spyOn(process, "exit")
        .mockImplementation((code?: number) => {
          expect(code).not.toBe(0);
          throw new Error("failed in mock implementation");
        });
      const mockLog = jest.spyOn(console, "log");

      try {
        await runCLI(["migrate", "foo"]);
      } catch (error) {
        expect(spyMigrate).not.toHaveBeenCalled();
        expect(error.message).toBe("failed in mock implementation");
        expect(mockExit).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalledWith(0);
        expect(mockLog).not.toHaveBeenCalled();
      }

      mockExit.mockRestore();
      mockLog.mockRestore();
    });

    it("can override the database config with a database url passed as an option", async () => {
      expect.assertions(2);

      const spyMigrate = jest
        .spyOn(migration, "runMigrations")
        .mockImplementation((config: RunMigrationsConfig) => {
          expect(config.database).toEqual({
            database: "database",
            host: "host",
            password: "password",
            port: 7777,
            username: "user",
          });
          return Promise.resolve();
        });

      try {
        await runCLI([
          "migrate",
          "--databaseURL",
          "postgres://user:password@host:7777/database",
        ]);
      } catch (error) {
        fail(error);
      }

      // Don't remove, this is a mysterious magic trick without it, tests do not pass
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(spyMigrate).toHaveBeenCalled();
    });

    describe("SSL certificate", () => {
      it("can override the database config with a SSL CA passed as an option, and a database URL is provided", async () => {
        expect.assertions(2);

        const spyMigrate = jest
          .spyOn(migration, "runMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                ca: "fake-root.crt",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "migrate",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslCaPath",
            "./test/ssl-certs/fake-root.crt",
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyMigrate).toHaveBeenCalled();
      });

      it("can override the database config with a SSL Key passed as an option, and a database URL is provided", async () => {
        expect.assertions(2);

        const spyMigrate = jest
          .spyOn(migration, "runMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                key: "fake-postgresql.key",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "migrate",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslKeyPath",
            "./test/ssl-certs/fake-postgresql.key",
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyMigrate).toHaveBeenCalled();
      });

      it("can override the database config with a SSL Cert passed as an option, and a database URL is provided", async () => {
        expect.assertions(2);

        const spyMigrate = jest
          .spyOn(migration, "runMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                cert: "fake-postgresql.crt",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "migrate",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslCertPath",
            "./test/ssl-certs/fake-postgresql.crt",
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyMigrate).toHaveBeenCalled();
      });

      it("can takes multiple SSL flags", async () => {
        expect.assertions(2);

        const spyMigrate = jest
          .spyOn(migration, "runMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                ca: "fake-postgresql.key",
                key: "fake-postgresql.key",
                cert: "fake-postgresql.crt",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "migrate",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslCaPath",
            "./test/ssl-certs/fake-postgresql.key",
            "--sslKeyPath",
            "./test/ssl-certs/fake-postgresql.key",
            "--sslCertPath",
            "./test/ssl-certs/fake-postgresql.crt",
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyMigrate).toHaveBeenCalled();
      });

      it("should work both with absolute or relative path", async () => {
        expect.assertions(2);

        const spyDryRun = jest
          .spyOn(migration, "runMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                ca: "fake-postgresql.key",
                key: "fake-postgresql.key",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "migrate",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslCaPath",
            "./test/ssl-certs/fake-postgresql.key",
            "--sslKeyPath",
            `${path.join(
              process.cwd(),
              "./test/ssl-certs/fake-postgresql.key",
            )}`,
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyDryRun).toHaveBeenCalled();
      });
    });

    it("can override the migrations table with the right option", async () => {
      expect.assertions(2);

      const spyMigrate = jest
        .spyOn(migration, "runMigrations")
        .mockImplementation((config: RunMigrationsConfig) => {
          expect(config.migration.tableName).toBe("custom_table");
          return Promise.resolve();
        });

      try {
        await runCLI(["migrate", "--migrationsTable", "custom_table"]);
      } catch (error) {
        fail(error);
      }
      // Don't remove, this is a mysterious magic trick without it, tests do not pass
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(spyMigrate).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const createArgs = ["create", "foo"];

    it("creates a timestamped migration file", async () => {
      const spyLog = jest.spyOn(console, "log").mockImplementation(jest.fn());
      expect.assertions(1);

      process.argv = [...createArgs];

      const config = await getConfig("./test/config.json");
      try {
        const createdMigrationFile = await createMigrationFile(
          "foo",
          config.migration.dirPath,
        );

        const migrationsDirPath = path.join(process.cwd(), "/test/migrations");

        const migrationFiles = await fs.promises.readdir(migrationsDirPath);

        expect(createdMigrationFile).toBe(
          migrationFiles[migrationFiles.length - 1],
        );
        await fs.promises.unlink(
          `${migrationsDirPath}/${createdMigrationFile}`,
        );
      } catch (error) {
        console.error(error);
      }

      spyLog.mockRestore();
    });

    it("handles too many arguments", async () => {
      expect.assertions(6);

      const argv = [...createArgs, "foo", "bar", "braz"];

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
        await runCLI(argv);
      } catch (error) {
        expect(spyCreate).not.toHaveBeenCalled();
        expect(error.message).toBe("failed in mock implementation");
        expect(mockExit).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalledWith(0);
        expect(mockLog).not.toHaveBeenCalled();
      }
    });
  });

  describe("dryRun", () => {
    const migrateArgs = ["dryRun", "path/migration/dir"];

    it("handles too many arguments", async () => {
      expect.assertions(6);

      const argv = [...migrateArgs, "foo", "bar", "braz"];

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
        await runCLI(argv);
      } catch (error) {
        expect(spyCreate).not.toHaveBeenCalled();
        expect(error.message).toBe("failed in mock implementation");
        expect(mockExit).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalledWith(0);
        expect(mockLog).not.toHaveBeenCalled();
      }
    });

    describe("SSL certificate", () => {
      it("can override the database config with a SSL CA passed as an option, and a database URL is provided", async () => {
        expect.assertions(2);

        const spyDryRun = jest
          .spyOn(migration, "dryRunPendingMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                ca: "fake-root.crt",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "dryRun",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslCaPath",
            "./test/ssl-certs/fake-root.crt",
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyDryRun).toHaveBeenCalled();
      });

      it("can override the database config with a SSL Key passed as an option, and a database URL is provided", async () => {
        expect.assertions(2);

        const spyDryRun = jest
          .spyOn(migration, "dryRunPendingMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                key: "fake-postgresql.key",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "dryRun",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslKeyPath",
            "./test/ssl-certs/fake-postgresql.key",
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyDryRun).toHaveBeenCalled();
      });

      it("can override the database config with a SSL Cert passed as an option, and a database URL is provided", async () => {
        expect.assertions(2);

        const spyDryRun = jest
          .spyOn(migration, "dryRunPendingMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                cert: "fake-postgresql.crt",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "dryRun",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslCertPath",
            "./test/ssl-certs/fake-postgresql.crt",
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyDryRun).toHaveBeenCalled();
      });

      it("can takes multiple SSL flags", async () => {
        expect.assertions(2);

        const spyDryRun = jest
          .spyOn(migration, "dryRunPendingMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                ca: "fake-postgresql.key",
                key: "fake-postgresql.key",
                cert: "fake-postgresql.crt",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "dryRun",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslCaPath",
            "./test/ssl-certs/fake-postgresql.key",
            "--sslKeyPath",
            "./test/ssl-certs/fake-postgresql.key",
            "--sslCertPath",
            "./test/ssl-certs/fake-postgresql.crt",
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyDryRun).toHaveBeenCalled();
      });

      it("should work both with absolute or relative path", async () => {
        expect.assertions(2);

        const spyDryRun = jest
          .spyOn(migration, "dryRunPendingMigrations")
          .mockImplementation((config: RunMigrationsConfig) => {
            expect(config.database).toEqual({
              database: "database",
              host: "host",
              password: "password",
              port: 7777,
              username: "user",
              ssl: {
                rejectUnauthorized: false,
                ca: "fake-postgresql.key",
                key: "fake-postgresql.key",
              },
            });

            return Promise.resolve();
          });

        try {
          await runCLI([
            "dryRun",
            "--databaseURL",
            "postgres://user:password@host:7777/database",
            "--sslCaPath",
            "./test/ssl-certs/fake-postgresql.key",
            "--sslKeyPath",
            `${path.join(
              process.cwd(),
              "./test/ssl-certs/fake-postgresql.key",
            )}`,
          ]);
        } catch (error) {
          fail(error);
        }

        // Don't remove, this is a mysterious magic trick without it, tests do not pass
        await new Promise((resolve) => setTimeout(resolve, 2000));

        expect(spyDryRun).toHaveBeenCalled();
      });
    });
  });
});
