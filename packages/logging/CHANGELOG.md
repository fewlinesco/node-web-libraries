# CHANGELOG

## 0.1.5 - 2022-05-02

- Bump all dependencies

## 0.1.4 - 2022-04-25

- [fix] add repository key in `package.json` to trigger the changelog in `dependabot`'s PRs description

## 0.1.3 - 2022-04-15

- [fix] move all dependencies from `devDependencies` to `dependencies` to make `@fwl/logging` work in any project.

## 0.1.2 - 2021-05-25

- The package now exports an `InMemoryLogger` to help with tests.
- Bumped the dependencies:

```sh
  @types/node                       dev    ~5mo  14.14.14  →   15.6.1   ⩽1d
  eslint-config-prettier            dev    ~5mo     7.1.0  →    8.3.0  ~1mo
  ts-node                           dev    ~6mo     9.1.1  →   10.0.0   ~2d
  @typescript-eslint/eslint-plugin  dev    ~5mo    4.11.0  →   4.25.0   ⩽1d
  @typescript-eslint/parser         dev    ~5mo    4.11.0  →   4.25.0   ⩽1d
  eslint                            dev    ~5mo    7.16.0  →   7.27.0   ~3d
  eslint-plugin-import              dev    ~8mo    2.22.1  →   2.23.3   ~3d
  eslint-plugin-prettier            dev    ~5mo     3.3.0  →    3.4.0  ~1mo
  prettier                          dev    ~6mo     2.2.1  →    2.3.0  ~15d
  ts-jest                           dev    ~7mo    26.4.4  →   26.5.6  ~20d
  typescript                        dev    ~5mo     4.1.3  →    4.2.4  ~2mo
  @types/jest                       dev    ~6mo   26.0.19  →  26.0.23  ~29d
```

## 0.1.1 - 2020-08-19

- Moved all logic to `logger.ts` and `index.ts` is now just used for exports

- Fix config exports

## 0.1.0 - 2020-08-18

- Renamed `@fwl/logging` from `@fewlines/fwl-logging`

- Added `LoggingConfig` and `defaultConfig`

- Breaking change: `createLogger()` now takes a `LoggingConfig` as an argument

## 1.0.1 - 2020-07-27

- Added `Metadata` type.

## 1.0.0 - 2020-04-16

- Created the package @fewlines/fwl-logging.
