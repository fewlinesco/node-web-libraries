# CHANGELOG

## 0.3.1 - 2020-08-18

- Now exports a `TracingConfig` type as well as a `defaultConfig`

## 0.3.0 - 2020-08-12

- Removed `pg` and `pg-pool` plugins, tracing integration for Postgres will need to be added manually to a database wrapper like `@fewlines/fwl-database`

## 0.2.1 - 2020-07-27

- Dependencies bump:
  - `@opentelemetry/core`: `0.5.2` => `0.9.0`
  - `@opentelemetry/exporter-zipkin`: `0.5.2` => `0.9.0`
  - `@opentelemetry/node`: `0.5.2` => `0.9.0`
  - `@opentelemetry/plugin-dns`: `0.5.2` => `0.8.0`
  - `@opentelemetry/plugin-express`: `0.5.2` => `0.8.0`
  - `@opentelemetry/plugin-http`: `0.5.2` => `0.9.0`
  - `@opentelemetry/plugin-https`: `0.5.2` => `0.9.0`
  - `@opentelemetry/plugin-pg`: `0.6.1` => `0.8.0`
  - `@opentelemetry/plugin-pg-pool`: `0.6.1` => `0.8.0`
  - `@opentelemetry/tracing`: `0.5.2` => `0.9.0`

## 0.2.0 - 2020-06-30

- Added `InMemoryTracer` and `InMemorySpan`.
- Updated documentation.

## 0.1.0 - 2020-05-19

- Created the package @fwl/tracing.
