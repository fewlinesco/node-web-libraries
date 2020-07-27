# CHANGELOG

## 0.1.5 - 2020-07-27

- Dependencies bump:
  - `pg`: `7.0.0` => `8.3.0`
  - `uuid`: `8.0.0` => `8.2.0`

## 0.1.4 - 2020-06-15

- Fixed the CLI call.

## 0.1.3 - 2020-06-09

- Fixed a bug related to unran migration from merged git branches timeline.

- Modified `getPendingMigrations` function + tests to get all unran migrations, regardless of last ran one.

- Removed `getLastMigration` function + tests from codebase.

- Added export of `SchemaMigrationsRow` type.

## 0.1.2 - 2020-05-29

- Added separate file to call migration as a CLI.

## 0.1.1 - 2020-05-26

- Fixed CLI script path call in package.json.

## 0.1.0 - 2020-05-26

- Created the package @fewlines/fwl-migration.
