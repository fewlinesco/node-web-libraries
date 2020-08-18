# CHANGELOG

## 0.1.2

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
