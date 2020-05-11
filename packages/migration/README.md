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

<!-- This package uses a `schema_migrations` table to provide a migration versioning, based on the file timestamp. The `createMigrationFile` will provide you a consistent migration file naming.

```typescript
migrate.createMigrationFile(process.argv);
``` -->

## Problematic

The `runMigrations` needs to have the `schema_migrations` sql file as the first migration ran. The user will need to run `createMigrationFile` and add the following query:

```sql
CREATE TABLE IF NOT EXISTS "schema_migrations" (
    "id" uuid NOT NULL,
    "version" varchar(14) NOT NULL,
    "file_name" varchar(255) NOT NULL,
    "query" BYTEA NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);
```

Should I to a step by step implementation in here or should I create a function that create the migration file and add the sql query in it ?

---

The current `createMigrationFile` use the npm script argument for the file name. Not sure how to do it otherwise. I can always add something like this to the usage section (but I find it really ugly):

The `createMigrationFile` needs to be run as a npm script to get the script argument.

```typescript
// createMigrationFile.ts
import * as migration from "@fewlines/fwl-migration";

const targetDir = path.join(process.cwd(), "/migration/folder");

migrate.createMigrationFile(process.argv, targetDir);
```

```json
// package.json
{
  ...
  "scripts": {
    "db:create-migration-file": "ts-node path/to/createMigrationFile.ts"
  },
  ...
}

```
