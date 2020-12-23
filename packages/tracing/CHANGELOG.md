# CHANGELOG

## 0.5.0 - 20200-12-22

- Add a `createRootSpan` function that will start a trace when the plugins can't be loaded (for instance, for a Next application).
- OpenTelemetry dependencies bumped to `0.14.0`.
- Removed OpenTelemetry Plugins to keep only `http` and `https` (loaded by default by OpenTelemetry).
- Added an `examples` directory.
- Updated `startTracer` to accept a second optional parameter `logger`.

## 0.4.0 - 2020-08-20

- The exported `Span` interface is now different from the one provided by `@opentelemetry/api` and only exposees `setAttribute`, `setDisclosedAttribute` and `end`.

- When using `setAttribute` on a `Span`, it will obfuscate values by default. Use `setDisclosedAttribute` to explicitely do so for a value.

## 0.3.3 - 2020-08-19

- Fix config export

## 0.3.2 - 2020-08-18

- Fix import issue in `tracer.ts`

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
