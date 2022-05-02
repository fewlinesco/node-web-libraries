# CHANGELOG

## 0.6.3 - 2022-05-02

- Bummp all dependencies

## 0.6.2 - 2022-04-22

- Bump version to see if dependabot shows the release note.

## 0.6.1 - 2022-04-15

- [fix] move all dependencies from `devDependencies` to `dependencies` to make `@fwl/database` work in any project.

## 0.6.0 - 2021-08-11

- Breaking Change: it is now forbidden to make a `client.query("ROLLBACK")` inside of a `transaction` callback since it could result in several `ROLLBACK` calls.
- the client inside of a transaction has now access to a `rollback()` function to trigger the rollback.
- For testing purposes, there is now a `database.connectInSandbox(options)` method that will do all queries inside of a transaction.

## 0.5.2 - 2021-05-27

- Bumped major:

```sh
  @types/node             dev     ~2d  14.17.1  →  15.6.1   ~2d
  @types/pg               dev    ~3mo  7.14.11  →   8.6.0   ~9d
  eslint-config-prettier  dev    ~4mo    7.2.0  →   8.3.0  ~1mo
  jest                    dev    ~7mo   26.6.3  →  27.0.1   ~2d
  ts-jest                 dev    ~22d   26.5.6  →  27.0.1   ⩽1d
  ts-node                 dev    ~6mo    9.1.1  →  10.0.0   ~4d
  @fwl/tracing                   ~4mo    0.9.0  →  0.10.0   ⩽1d
```

- Bumped minor:

```sh
  pg                                       ~6mo     8.5.1  →    8.6.0  ~1mo
  @types/node                       dev    ~5mo  14.14.20  →  14.17.1   ~2d  (15.6.1 avaliable)
  @typescript-eslint/eslint-plugin  dev    ~5mo    4.12.0  →   4.25.0   ~3d
  @typescript-eslint/parser         dev    ~5mo    4.12.0  →   4.25.0   ~3d
  eslint                            dev    ~5mo    7.17.0  →   7.27.0   ~5d
  eslint-config-prettier            dev    ~5mo     7.1.0  →    7.2.0  ~4mo  (8.3.0 avaliable)
  eslint-plugin-prettier            dev    ~5mo     3.3.1  →    3.4.0  ~1mo
  prettier                          dev    ~6mo     2.2.1  →    2.3.0  ~18d
  ts-jest                           dev    ~7mo    26.4.4  →   26.5.6  ~22d  (27.0.1 avaliable)
  typescript                        dev    ~6mo     4.1.3  →    4.3.2   ⩽1d
  @types/jest                       dev    ~6mo   26.0.19  →  26.0.23  ~1mo
  @types/pg                         dev    ~6mo    7.14.7  →  7.14.11  ~3mo  (8.6.0 avaliable)
```

## 0.5.1 - 2021-02-09

- Bump `@fwl/tracing`.

## 0.5.0 - 2021-02-08

- The config type has been changed back to only `DatabaseConfig` which is now either `DatabaseConfigWithDatabaseUrl` or `DatabaseConfigWithObject`.

## 0.4.1 - 2021-02-08

- Bump `fwl/tracing`.

## 0.4.0 - 2021-02-05

- The SSL typing in `DatabaseConfigWithDatabaseUrl` and `DatabaseConfig` has been changed from `boolean` to `boolean | ConnectionOptions` to match the package `pg` ssl option.
- SSL connections are now allowed for `connect`, `connectInSandbox` and `connectWithoutTracing`.

## 0.3.2 - 2021-02-04

- `connectInSandbox` and `connectWithoutTracing` now accept a `DatabaseConfigWithDatabaseUrl` as `connect` does.
- When the `connect` function was provided with a `DatabaseConfigWithDatabaseUrl`, the `ssl` options was left unused. This is now fixed.

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
