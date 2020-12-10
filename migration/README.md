# FWL Migration

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides a migration tool using SQL files.

## Installation

```shell
yarn add @fwl/migration
```

## Usage

`migration` is a database migrations written in TypeScript which can be used as a **CLI** of imported as a **package**.

It will look into the migrations folder and execute each SQL queries, in the correct order. If one of the transaction fails, `migration` will keep track of the last successful query through a `migration_schemas` table, so you can safely rerun the migration process.

### `config.json`

To run `migration` as a cli, you need to create a `config.json` with the following data structure:

```ts
{
  "database": {
    "database": string;
    "password": string;
    "username": string;
    "host": string;
    "port": number;
  },
  "migration": {
    "dirPath": string;
  }
}
```

### CLI

To use `migration` as a CLI, simply run one of those command, depending on your needs:

- `migration migrate`: run the migration process. The following options can be passed to this command:
  - `configPath`: override the path to the configuration file (default: "./config.json").
  - `databaseURL`: override the database configuration, should be a valid postgres URL (stronger than the configuration file).
  - `migrationsPath`: override the path to the migrations SQL files (stronger than the configuration file).
  - `migrationsTable`: override the table name in which ran migrations are registered (stronger than the configuration file).
- `migration dryRun path/to/config.json`: run the migration process and rolls it back right away. The following options can be passed to this command:
  - `configPath`: override the path to the configuration file (default: "./config.json").
  - `databaseURL`: override the database configuration, should be a valid postgres URL (stronger than the configuration file).
  - `migrationsPath`: override the path to the migrations SQL files (stronger than the configuration file).
  - `migrationsTable`: override the table name in which ran migrations are registered, (stronger than the configuration file).
- `migration create name_of_the_file`: create a timestamped migration file in the path set up in `config.json`. The following options can be passed to this command:
  - `configPath`: override the path to the configuration file (default: "./config.json").
  - `migrationsPath`: override the path to the migrations SQL files (stronger than the configuration file).

### Package

If you need more customization and control over the migration process, you can implement your own logic by importing the package, which give you access to two functions.

#### runMigrations

You will have to give a config of `runMigrationsConfig` type as argument but you can also use default settings by using the provided `defaultConfig` for the migrations folder and the database config:

```ts
import * as migration from "@fwl/migration";
import { defaultConfig as databaseDefaultConfig } from "@fwl/database";

migration.runMigrations({
  database: databaseDefaultConfig,
  migration: migration.defaultConfig,
});
```

#### createMigrationFile

The `createMigrationFile` takes the name of the file as an argument:

```ts
import * as migration from "@fwl/migration";

migration.createMigrationFile("name_of_the_file");
```

You can also use it through a custom npm script, and use the corresponding `process.argv` value as arguments.
