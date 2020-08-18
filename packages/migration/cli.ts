import {
  runMigrations,
  createMigrationFile,
  dryRunPendingMigrations,
} from "./index";
import { getConfig } from "./utils/getConfig";

type MigrationErrors = { [key: string]: { [key: string]: string } };

export const ERRORS: MigrationErrors = {
  migrate: {
    tooManyArgs:
      "Too many arguments arguments. To run a migration, please run 'migration --migrate path/to/config.json'",
  },
  dryRun: {
    tooManyArgs:
      "Too many arguments arguments. To run a migration dry run, please run 'migration --dry-run path/to/config.json'",
  },
  create: {
    tooManyArgs:
      "Too many arguments arguments. To create a timestamped migration file, please run 'migration --create name_of_the_file'",
  },
  default: {
    list: `Please provide one of the following flags:\n\n  - "migration --migrate path/to/config.json": run the migration process.\n  - "migration --create name_of_the_file": create a timestamped migration file in the path set up in config.json.`,
  },
};

export async function runCLI(): Promise<void> {
  const [, , ...args] = process.argv;

  if (args.length > 0) {
    if (args[0] === "--migrate") {
      if (args.length === 2) {
        const config = await getConfig(args[1]);

        runMigrations(config);
      } else {
        throw new Error(ERRORS.migrate.tooManyArgs);
      }
    } else if (args[0] === "--dry-run") {
      if (args.length === 2) {
        const config = await getConfig(args[1]);
        dryRunPendingMigrations(config);
      }
      throw new Error(ERRORS.dryRun.tooManyArgs);
    } else if (args[0] === "--create") {
      if (args.length === 2) {
        createMigrationFile(args[1]);
      } else {
        throw new Error(ERRORS.create.tooManyArgs);
      }
    }
  } else {
    throw new Error(ERRORS.default.list);
  }
}
