# FWL Logging

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides an interface for either a JSON based or a Key/Value based logger.

Both have the same API and does not provide log levels.

This is intended as we consider that a log should either be there or not be there.
There should not be differences of level between production and development as we won't be able to use debug logging in production.

## Installation

```shell
yarn add @fewlines/fwl-logging
```

## Usage

You first need to create the Logger:

```typescript
import { createLogger } from "@fewlines/fwl-logging";

const KVLogger = createLogger("service-name");
const JSONLogger = createLogger("service-name", "json");
```

After that you make a simple log with the `.log` function with or without arguments:

```typescript
KVLogger.log("this is a log");
// service=service-name message="this is a log"

JSONLogger.log("this is a log");
// {"message":"this is a log","service":"service-name"}

KVLogger.log("this is a log", {additionalData: "value"});
// service=service-name additonalData=value message="this is a log"

JSONLogger.log("this is a log", {additionalData: "value"});
// {"additionalData":"value","message":"this is a log","service":"service-name"}
```

Or you could create a new logger with additionnal data:

```typescript
const myProcessLogger = KVLogger.withMeta({process: "my-process});
myProcessLogger.log("this is a log");
// service=service-name process=my-process message="this is a log"

const myProcessJSONLogger = JSONLogger.withMeta({process: "my-process});
myProcessJSONLogger.log("this is a log");
// {"message":"this is a log","service":"service-name","process":"my-process"}
```
