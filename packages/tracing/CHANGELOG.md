# CHANGELOG

## 0.10.1 - 2021-05-27

- Added a `collectors` key to the Config to allow configuring several OpenTelemetry exporters

## 0.10.0 - 2021-05-25

- Improved OpenTelemetry configs for the example repos.
- OpenTelemetry bumps:

```sh
  @opentelemetry/api                         ~4mo  0.16.0  →  1.0.0-rc.3  ~1d
  @opentelemetry/context-async-hooks         ~4mo  0.16.0  →  0.19.0  ~1mo
  @opentelemetry/core                        ~4mo  0.16.0  →  0.19.0  ~1mo
  @opentelemetry/exporter-collector          ~4mo  0.16.0  →  0.19.0  ~1mo
  @opentelemetry/exporter-zipkin             ~4mo  0.16.0  →  0.19.0  ~1mo
  @opentelemetry/node                        ~4mo  0.16.0  →  0.19.0  ~1mo
  @opentelemetry/plugin-http                 ~4mo  0.16.0  →  0.18.2  ~2mo
  @opentelemetry/plugin-https                ~4mo  0.16.0  →  0.18.2  ~2mo
  @opentelemetry/tracing                     ~4mo  0.16.0  →  0.19.0  ~1mo
```

- Major bumps:

```sh
  @types/node                         dev     ⩽1d  14.17.1  →  15.6.1   ⩽1d
  eslint-config-prettier              dev    ~4mo    7.2.0  →   8.3.0  ~1mo
  ts-node                             dev    ~6mo    9.1.1  →  10.0.0   ~2d
```

- Minor bumps:

```sh
  @types/node                       dev    ~4mo  14.14.25  →  14.17.1   ⩽1d
  @typescript-eslint/eslint-plugin  dev    ~4mo    4.14.2  →   4.25.0   ⩽1d
  @typescript-eslint/parser         dev    ~4mo    4.14.2  →   4.25.0   ⩽1d
  eslint                            dev    ~4mo    7.19.0  →   7.27.0   ~3d
  eslint-plugin-import              dev    ~8mo    2.22.1  →   2.23.3   ~4d
  eslint-plugin-prettier            dev    ~5mo     3.3.1  →    3.4.0  ~1mo
  prettier                          dev    ~6mo     2.2.1  →    2.3.0  ~16d
  typescript                        dev    ~5mo     4.1.3  →    4.2.4  ~2mo
  @fwl/logging                             ~9mo     0.1.1  →    0.1.2   ⩽1d
  @fewlines/eslint-config           dev    ~4mo     3.1.0  →    3.1.2  ~3mo
  @types/jest                       dev    ~5mo   26.0.20  →  26.0.23  ~29d
  ts-jest                           dev    ~4mo    26.5.0  →   26.5.6  ~20d
```

## 0.9.0 - 2021-02-09

- `tracer.withSpan` is now parameterizable and returns whatever the callback returns.
- OpenTelemetry dependencies bumped to `0.16.0`.

## 0.8.1 - 2021-02-05

- Addition `@fwl/logging` in dependencies.

## 0.8.0 - 2021-02-03

- Removal of `tracer.createRootSpan` as it is a source of bugs where traces get spans mixed up.
- Addition of `tracer.withSpan(name, callback)` that can do the same job as the previous `createRootSpan`: everything Span that is called within the callback will be associated with this Span.
- Addition of `tracer.getCurrentSpan()`: it can be called anywhere within the clalback of `withSpan` to get the Parent Span.
- When creating the Tracer, we can now add attributes that will be present in all traces.

## 0.7.0 - 2021-01-13

- Add Lightstep Public Sattelite support.
- The `TracerConfig` type is updated to reflect this change:

```typescript
type TracingConfig = {
  simpleCollector?: {
    serviceName: string;
    url: string;
  };
  lightstepPublicSatelliteCollector?: {
    serviceName: string;
    accessToken: string;
    url?: string;
  };
};
```

- ## 0.6.2 - 2021-01-07

- Disable explicitely `pg` and `pg-pool` modules.
- Add `http` and `https` modules to the dependencies, to have them loaded automatically.

## 0.6.1 - 2021-01-04

- Calling `startTracer` several times will not register several tracers anymore.

## 0.6.0 - 2020-12-31

- The exported `Span` interface now exposes `addEvent` to add events to spans.
- The exported `Span` interface now exposes `getTraceId` to get the id of the current trace.
- InMemoryTracer Span ID is now of type `string`.

## 0.5.1 - 2020-12-29

- Added back a `Tracer` type.

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
