import { DatabaseConfig } from "@fwl/database";
import * as fs from "fs";
import * as path from "path";
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
  desc: "Run the migration process.",
  builder: (yargs) =>
    yargs
      .option("configPath", {
        default: "./config.json",
        describe:
          "Override the path to the config file (default: './config.json').",
        type: "string",
      })
      .option("databaseURL", {
        describe:
          "Override the URL to the database (stronger priority than the config file).",
        type: "string",
      })
      .option("sslCaPath", {
        describe:
          "Can be the relative or the absolute path to the file. Add the SSL CA to the config object, and set 'rejectUnauthorized' to false (stronger priority than the config file).",
        type: "string",
      })
      .option("sslKeyPath", {
        describe:
          "Can be the relative or the absolute path to the file. Add the SSL KEY to the config object, and set 'rejectUnauthorized' to false (stronger priority than the config file).",
        type: "string",
      })
      .option("sslCertPath", {
        describe:
          "Can be the relative or the absolute path to the file. Add the SSL CERT to the config object, and set 'rejectUnauthorized' to false (stronger priority than the config file).",
        type: "string",
      })
      .option("migrationsPath", {
        describe:
          "Override the configured path for the folder where migrations files are stored. If no configuration is provided migrations will be written in './migrations'.",
        type: "string",
      })
      .option("migrationsTable", {
        describe:
          "Override the configured table hosting the migrations (stronger priority than the config file).",
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
        tableName: argv.migrationsTable,
      },
    };

    if (
      overrides.database &&
      (argv.sslCaPath || argv.sslKeyPath || argv.sslCertPath) &&
      typeof overrides.database.ssl !== "boolean"
    ) {
      overrides.database.ssl = { rejectUnauthorized: false };
    }

    if (
      overrides.database &&
      argv.sslCaPath &&
      typeof overrides.database.ssl !== "boolean"
    ) {
      const targetedFile = path.isAbsolute(argv.sslCaPath)
        ? argv.sslCaPath
        : path.join(process.cwd(), argv.sslCaPath);

      overrides.database.ssl.ca = fs.readFileSync(targetedFile).toString();
    }

    if (
      overrides.database &&
      argv.sslKeyPath &&
      typeof overrides.database.ssl !== "boolean"
    ) {
      const targetedFile = path.isAbsolute(argv.sslKeyPath)
        ? argv.sslKeyPath
        : path.join(process.cwd(), argv.sslKeyPath);

      overrides.database.ssl.key = fs.readFileSync(targetedFile).toString();
    }

    if (
      overrides.database &&
      argv.sslCertPath &&
      typeof overrides.database.ssl !== "boolean"
    ) {
      const targetedFile = path.isAbsolute(argv.sslCertPath)
        ? argv.sslCertPath
        : path.join(process.cwd(), argv.sslCertPath);

      overrides.database.ssl.cert = fs.readFileSync(targetedFile).toString();
    }

    return _loadConfig(argv.configPath, overrides)
      .then((config) => {
        return config;
      })
      .then((config) => runMigrations(config))
      .then(() => {
        argv._handled = true;
        return argv;
      });
  },
};

const createCommand = {
  command: "create [name]",
  desc: "Create a timestamped migration file in the path set up in config.json.",
  builder: (yargs) =>
    yargs
      .option("configPath", {
        default: "./config.json",
        describe: "Override the path to the config file.",
        type: "string",
      })
      .option("migrationsPath", {
        describe:
          "Override the configured path for the folder where migrations files are stored, if no configuration is provided migrations will be written in './migrations'.",
        type: "string",
      })
      .strict(),

  handler: async (argv) => {
    const overrides = argv.migrationPath
      ? { migration: { dirPath: argv.migrationPath } }
      : {};
    const config = await _loadConfig(argv.configPath, overrides);
    return createMigrationFile(
      name as unknown as string,
      config.migration.dirPath,
    );
  },
};

const dryRunCommand = {
  command: "dryRun",
  desc: "run the migration process.",
  builder: (yargs) =>
    yargs
      .option("configPath", {
        default: "./config.json",
        describe:
          "Override the path to the config file (default: './config.json').",
        type: "string",
      })
      .option("databaseURL", {
        describe:
          "Override the URL to the database (stronger priority than the config file).",
        type: "string",
      })
      .option("sslCaPath", {
        describe:
          "Can be the relative or the absolute path to the file. Add the SSL CA to the config object, and set 'rejectUnauthorized' to false (stronger priority than the config file).",
        type: "string",
      })
      .option("sslKeyPath", {
        describe:
          "Can be the relative or the absolute path to the file. Add the SSL KEY to the config object, and set 'rejectUnauthorized' to false (stronger priority than the config file).",
        type: "string",
      })
      .option("sslCertPath", {
        describe:
          "Can be the relative or the absolute path to the file. Add the SSL CERT to the config object, and set 'rejectUnauthorized' to false (stronger priority than the config file).",
        type: "string",
      })
      .option("migrationsPath", {
        describe:
          "Override the configured path for the folder where migrations files are stored. If no configuration is provided migrations will be written in './migrations'.",
        type: "string",
      })
      .option("migrationsTable", {
        describe:
          "Override the configured table hosting the migrations (stronger priority than the config file).",
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
        tableName: argv.migrationsTable,
      },
    };

    if (
      overrides.database &&
      (argv.sslCaPath || argv.sslKeyPath || argv.sslCertPath) &&
      typeof overrides.database.ssl !== "boolean"
    ) {
      overrides.database.ssl = { rejectUnauthorized: false };
    }

    if (
      overrides.database &&
      argv.sslCaPath &&
      typeof overrides.database.ssl !== "boolean"
    ) {
      const targetedFile = path.isAbsolute(argv.sslCaPath)
        ? argv.sslCaPath
        : path.join(process.cwd(), argv.sslCaPath);

      overrides.database.ssl.ca = fs.readFileSync(targetedFile).toString();
    }

    if (
      overrides.database &&
      argv.sslKeyPath &&
      typeof overrides.database.ssl !== "boolean"
    ) {
      const targetedFile = path.isAbsolute(argv.sslKeyPath)
        ? argv.sslKeyPath
        : path.join(process.cwd(), argv.sslKeyPath);

      overrides.database.ssl.key = fs.readFileSync(targetedFile).toString();
    }

    if (
      overrides.database &&
      argv.sslCertPath &&
      typeof overrides.database.ssl !== "boolean"
    ) {
      const targetedFile = path.isAbsolute(argv.sslCertPath)
        ? argv.sslCertPath
        : path.join(process.cwd(), argv.sslCertPath);

      overrides.database.ssl.cert = fs.readFileSync(targetedFile).toString();
    }

    return _loadConfig(argv.configPath, overrides)
      .then((config) => dryRunPendingMigrations(config))
      .then(() => {
        argv._handled = true;
        return argv;
      });
  },
};

async function runCLI(args: string[]): Promise<void> {
  await yargs
    .command(migrateCommand)
    .command(createCommand)
    .command(dryRunCommand)
    .demandCommand()
    .help("help")
    .parse(args);
}

export { runCLI };
