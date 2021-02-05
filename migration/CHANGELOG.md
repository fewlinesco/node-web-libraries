# CHANGELOG

All notable changes to this project will be documented in this file.

## [0.1.0] - 2020-08-19

- Add the new `fwl/database` type in the `RunMigrationsConfig` database's types allowing now to provide either a `DatabaseConfigWithDatabaseUrl` or a `DatabaseConfig`.
## [0.1.0] - 2020-08-19

- Renamed `@fwl/migration` from `@fewlines/fwl-migration`

- Moved config to `config.ts` and separated it as `MigrateConfig` and `DatabaseConfig` which is imported from `@fwl/database`

- **Breaking:** `runMigrations` now takes a mandatory config argument and doesn't try to fetch the configuration by itself. It is better done upwards and easier to debug if we only have a single way to provide the configuration.

- Bump `@fwl/database` to `0.1.3`

## [0.1.6] - 2020-08-13

- added `--dry-run` option to run pending migrations without commiting them to quickly check for errors

- Dependencies bump:
  - `@fewlines/fwl-database`: `1.1.0` => `@fwl/database`: `0.1.1` (Package was renamed)

## [0.1.5] - 2020-07-27

- Dependencies bump:
  - `uuid`: `8.0.0` => `8.2.0`

## [0.1.4] - 2020-06-15

- Fixed the CLI call.

## [0.1.3] - 2020-06-09

- Fixed a bug related to unran migration from merged git branches timeline.

- Modified `getPendingMigrations` function + tests to get all unran migrations, regardless of last ran one.

- Removed `getLastMigration` function + tests from codebase.

- Added export of `SchemaMigrationsRow` type.

## [0.1.2] - 2020-05-29

- Added separate file to call migration as a CLI.

## [0.1.1] - 2020-05-26

- Fixed CLI script path call in package.json.

## [0.1.0] - 2020-05-26

- Created the package @fewlines/fwl-migration.
