# CHANGELOG

All notable changes to this project will be documented in this file.

## [0.2.4] - 2022-06-08

- Removed the `"prepare"` script to avoid failing installation

## [0.2.3] - 2022-06-08

- Added `yargs` as a dependency
- Removed development dependencies from the package to be leveraged by Lerna

## [0.2.2] - 2022-05-24

- Bump node types & eslint.

## [0.2.1] - 2022-05-02

- Bump all dependencies.

## [0.2.0] - 2021-05-04

- Added three new flags to the CLI to pass SSL certificate alongside the DB call for `migrate` and `dryRun`:
  - `sslCaPath`
  - `sslKeyPath`
  - `sslCertPath`
- Updated the documentation
- Bumped dependencies

```sh
  @types/node                       dev    ~3mo  14.14.25  →   15.0.1   ~6d
  eslint-config-prettier            dev    ~3mo     7.2.0  →    8.3.0   ~9d
  yargs                             dev    ~5mo    16.2.0  →   17.0.0   ⩽1d
  @typescript-eslint/eslint-plugin  dev    ~3mo    4.15.0  →   4.22.0  ~21d
  @typescript-eslint/parser         dev    ~3mo    4.15.0  →   4.22.0  ~21d
  eslint                            dev    ~3mo    7.19.0  →   7.25.0   ~9d
  eslint-plugin-prettier            dev    ~4mo     3.3.1  →    3.4.0  ~18d
  typescript                        dev    ~5mo     4.1.3  →    4.2.4  ~26d
  @fewlines/eslint-config           dev    ~3mo     3.1.0  →    3.1.2  ~2mo
  @types/jest                       dev    ~4mo   26.0.20  →  26.0.23   ~7d
  @types/pg                         dev    ~3mo    7.14.9  →  7.14.11  ~2mo
  ts-jest                           dev    ~3mo    26.5.1  →   26.5.5  ~18d
```

## [0.1.3] - 2021-03-29

- Fixed CLI exit code in case of an exception raised.

## [0.1.2] - 2021-02-09

- Bump `fwl/database` to bump OpenTelemetry Tracing

## [0.1.1] - 2021-02-08

- Bump `fwl/database` to allow the use of a database url in configuration.

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
