# CHANGELOG

## 0.3.1 - 2021-02-03

- `connect` now accepts a `DatabaseConfigWithDatabaseUrl` config that allows to reach the database through its url.
- Both `DatabaseConfigWithDatabaseUrl` and `DatabaseConfig` accept a `ssl` boolean key.

## 0.3.0 - 2021-01-07

- `DatabaseQueryRunner` is now a union type of `DatabaseQueryRunnerWithTracing`, `DatabaseQueryRunnerWithoutTracing`, `DatabaseQueryRunnerSandbox`.

## 0.2.0 - 2021-01-06

- Added a new Sandbox mode for testing purposes.

## 0.1.4 - 2020-08-19

- Added new `Error` types -> `BadUUIDError` and `DuplicateEntryError`


## 0.1.3 - 2020-08-19

- Moved all logic from `index.ts` to `database.ts`, `index.ts` is now only used for exports
- fix config export issue

## 0.1.2 - 2020-08-18

- Added `DatabaseConfig` type and `defaultConfig` export
- `connect` and `connectWithoutTracing` now takes a config as an optional argument and uses the `defaultConfig` if none is passed
- Bumped `@fwl/tracing` to `0.3.1`

## 0.1.1 - 2020-08-18

- Added `@fwl/tracing` to dependencies which was forgotten in `0.1.0`

## 0.1.0 - 2020-08-12

- Package renamed from `@fewlines/fwl-database` to `@fwl/database` and resetted the version
- Enabled basic tracing on `queryRunner` functions
- `connect` now takes a required tracer argument, `connectWithoutTracing` is now the way to generate a `queryRunner` without tracing enabled


## 1.1.1 - 2020-07-27

- Dependencies bump:
  - `pg`: `7.0.0` => `8.3.0`
- Created the CHANGELOG.md.
