# FWL Logging

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides an interface for either a JSON based or a Key/Value based logger.

Both have the same API and does not provide log levels.

This is intended as we consider that a log should either be there or not be there.
There should not be differences of level between production and development as we won't be able to use debug logging in production.

## Installation

```shell
yarn add @fwl/logging
```

## Usage

You first need to create the Logger:

```typescript
import { createLogger, EncoderTypeEnum } from "@fwl/logging";

const KVLogger = createLogger({
  service: "service-name",
  encoder: EncoderTypeEnum.KV,
});
const JSONLogger = createLogger({
  service: "service-name",
  encoder: EncoderTypeEnum.JSON,
});
```

After that you make a simple log with the `.log` function with or without arguments:

```typescript
KVLogger.log("this is a log");
// service=service-name message="this is a log"

JSONLogger.log("this is a log");
// {"message":"this is a log","service":"service-name"}

KVLogger.log("this is a log", { additionalData: "value" });
// service=service-name additonalData=value message="this is a log"

JSONLogger.log("this is a log", { additionalData: "value" });
// {"additionalData":"value","message":"this is a log","service":"service-name"}
```

Or you could create a new logger with additional data:

```typescript
const myProcessLogger = KVLogger.withMeta({ process: "my-process" });
myProcessLogger.log("this is a log");
// service=service-name process=my-process message="this is a log"

const myProcessJSONLogger = JSONLogger.withMeta({ process: "my-process" });
myProcessJSONLogger.log("this is a log");
// {"message":"this is a log","service":"service-name","process":"my-process"}
```

## Logging during tests

If you need to use the logger in a testing environment, we provide an `InMemoryLogger` class that act as a regular logger, except it will only store the logs. Logs can be accessed using the `getLog` method, which takes the log index as parameter. The usage is the same, you just need to initialize `InMemoryLogger` instead of using `createLogger()`.

Here is an example of use in a test file using `jest`:

```ts
import { InMemoryTracer } from "@fwl/tracing";

let logger: InMemoryLogger;

beforeEach(() => {
  logger = new InMemoryLogger();
});

test("verify log entry", () => {
  expect.assertions(1);

  // Call the code that is using a logger.

  const log = logger.getLog(0);

  expect(log).toBe("Your log");
});
```
