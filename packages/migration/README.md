# FWL Database

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides a migration tool using SQL files.

## Installation

```shell
yarn add @fewlines/fwl-migration
```

## Usage

The `runMigrations` function takes two arguments:

- The `databaseQueryRunner` provided by the `Database` package.
- The path to your sql migration files folder.

```typescript
import * as database from "@fewlines/fwl-database";
import * as migration from "@fewlines/fwl-migration";

// See [Database documentation](./packages/database/README.md) for implementation.
const databaseQueryRunner: database.DatabaseQueryRunner = database.connect(
  config.database
);

// Should I show this or use an example without the `Path` module ?
const migrationsDirPath = path.join(process.cwd(), "/migrations/folder");

migration.runMigrations(databaseQueryRunner, migrationsDirPath);
```
