# Dependencies issues

## Problems

### "@opentelemetry/\*"

Concernes all @opentelemetry packages

- current version: 0.14.0
- wanted version: 0.16.0

The new versions of opentelemetry introduce breaking changes, notabily, they removed `withSpan` and `getCurrentSpan` from the `Tracer` type.

Link to changes: https://github.com/open-telemetry/opentelemetry-js/pull/1764/files#diff-dfc982f98a42e996ae5970988f328bd9a4f8f43647b26911d6db87d20656149c
Link to changelog: https://github.com/open-telemetry/opentelemetry-js/blob/main/CHANGELOG.md#0160
