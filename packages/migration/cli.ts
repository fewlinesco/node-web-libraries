#!/usr/bin/env node
import { runMigrations, createMigrationFile } from "./index";
import { getConfig } from "./utils/getConfig";

type MigrationErrors = { [key: string]: { [key: string]: string } };

export const ERRORS: MigrationErrors = {
  migrate: {
    tooManyArgs:
      "Too many arguments arguments. To run a migration, please run 'migration --migrate path/to/config.json'",
  },
  create: {
    tooManyArgs:
      "Too many arguments arguments. To create a timestamped migration file, please run 'migration --create nameOfTheFile'",
  },
  default: {
    list: `Please provide one of the following flags:\n\n  - "--migrate path/to/config.json": run the migration process.\n  - "--create nameOfTheFile": create a timestamped migration file.`,
  },
};

export async function runCLI(): Promise<void> {
  const [, , ...args] = process.argv;

  if (args.length > 0) {
    if (args[0] === "--migrate") {
      if (args.length < 3) {
        const config = await getConfig(args[1]);

        runMigrations(config);
      } else {
        throw new Error(ERRORS.migrate.tooManyArgs);
      }
    } else if (args[0] === "--create") {
      if (args.length < 3) {
        createMigrationFile(args[1]);
      } else {
        throw new Error(ERRORS.create.tooManyArgs);
      }
    }
  } else {
    throw new Error(ERRORS.default.list);
  }
}

runCLI();
