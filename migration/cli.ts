import { DatabaseConfig } from "@fwl/database";
import * as yargs from "yargs";

import { RunMigrationsConfig, defaultMigrationConfig } from "./config/config";
import {
  runMigrations,
  createMigrationFile,
  dryRunPendingMigrations,
} from "./index";
import { getConfig, parseDatabaseURL } from "./utils/getConfig";

type Overrides = {
  database?: DatabaseConfig;
  migration?: {
    dirPath?: string;
    tableName?: string;
  };
};

function _loadConfig(
  configPath?: string,
  overrides?: Overrides,
): Promise<RunMigrationsConfig> {
  return getConfig(configPath)
    .catch((_error) => {
      console.error(
        `could not find a config file at ${configPath}, using default config\n`,
      );
      return defaultMigrationConfig;
    })
    .then((config: RunMigrationsConfig) => {
      return {
        database: overrides.database || config.database,
        migration: {
          dirPath: overrides.migration.dirPath || config.migration.dirPath,
          tableName:
            overrides.migration.tableName || config.migration.tableName,
        },
      };
    });
}

const migrateCommand = {
  command: "migrate",
  desc: "run the migration process.",
  builder: (yargs) =>
    yargs
      .option("configPath", {
        default: "./config.json",
        describe: "override the path to the config file",
        type: "string",
      })
      .option("databaseURL", {
        describe:
          "override the URL to the database, has a stronger priority than the config file",
        type: "string",
      })
      .option("migrationsPath", {
        describe:
          "override the configured path for the folder where migrations files are stored, if no configuration is provided migrations will be written in './migrations'",
        type: "string",
      })
      .option("migrationsTable", {
        describe: "override the configured table hosting the migrations",
        type: "string",
      })
      .strict(),
  handler: (argv) => {
    const overrides = {
      database: argv.databaseURL
        ? parseDatabaseURL(argv.databaseURL)
        : undefined,
      migration: {
        dirPath: argv.migrationsPath,
        migrationsTable: argv.migrationsTable,
      },
    };
    return _loadConfig(argv.configPath, overrides)
      .then((config) => runMigrations(config))
      .then(() => {
        argv._handled = true;
        return argv;
      });
  },
};

const createCommand = {
  command: "create [name]",
  desc:
    "create a timestamped migration file in the path set up in config.json.",
  builder: (yargs) =>
    yargs
      .option("configPath", {
        default: "./config.json",
        describe: "override the path to the config file",
        type: "string",
      })
      .option("migrationsPath", {
        describe:
          "override the configured path for the folder where migrations files are stored, if no configuration is provided migrations will be written in './migrations'",
        type: "string",
      })
      .strict(),

  handler: async (argv) => {
    const overrides = argv.migrationPath
      ? { migration: { dirPath: argv.migrationPath } }
      : {};
    const config = await _loadConfig(argv.configPath, overrides);
    return createMigrationFile(name, config.migration.dirPath);
  },
};

const dryRunCommand = {
  command: "dryRun",
  desc: "run the migration process.",
  builder: (yargs) =>
    yargs
      .option("configPath", {
        default: "./config.json",
        describe: "override the path to the config file",
        type: "string",
      })
      .option("databaseURL", {
        describe:
          "override the URL to the database, has a stronger priority than the config file",
        type: "string",
      })
      .option("migrationsPath", {
        describe:
          "override the configured path for the folder where migrations files are stored, if no configuration is provided migrations will be written in './migrations'",
        type: "string",
      })
      .option("migrationsTable", {
        describe: "override the configured table hosting the migrations",
        type: "string",
      })
      .strict(),
  handler: (argv) => {
    const overrides = {
      database: argv.databaseURL
        ? parseDatabaseURL(argv.databaseURL)
        : undefined,
      migration: {
        dirPath: argv.migrationsPath,
        tableName: argv.migrationsTable
      },
    };
    _loadConfig(argv.configPath, overrides)
      .then((config) => dryRunPendingMigrations(config))
      .then(() => {
        argv._handled = true;
        return argv;
      });
  },
};

export async function runCLI(): Promise<void> {
  await yargs
    .command(migrateCommand)
    .command(createCommand)
    .command(dryRunCommand)
    .demandCommand()
    .help("help").argv;
}
