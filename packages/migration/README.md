# FWL Database

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides a migration tool using SQL files.

## Installation

```shell
yarn add @fewlines/fwl-migration
```

## Usage

`migration` is a database migrations written in TypeScript which can be used as a **CLI** of imported as a **package**.

It will look into the migrations folder and execute each SQL queries, in the correct order. If one of the transaction fails, `migration` will keep track of the last successful query, so you can safely rerun the migration process.

### `config.json`

To run `migration`, you need to create a `config.json` with the following data structure:

```ts
{
  "database": {
    "database": string;
    "password": string;
    "username": string;
    "host": string;
    "port": number;
  },
  "http": {
    "port": number;
  },
  "tracing": {
    "serviceName": string;
  },
  "migration": {
    "dirPath": string;
  }
}
```

### CLI

To use `migration` as a CLI, simply run one of those command, depending on your needs:

- "--migrate path/to/config.json": run the migration process.
- "--create name_of_the_file": create a timestamped migration file in the path set up in `config.json`.

### Package

If you need more customization and control over the migration process, you can implement your own logic by importing the package, which give you access to two functions.

#### runMigrations

#### createMigrationFile
