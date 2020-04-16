# FWL Config

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

Itp provides the basic types for a `Config` object for using a `config.json` file instead of environment variables.

## Installation

```shell
yarn add @fewlnes/fwl-config
```

## Usage

Here is a basic example of usage

```typescript
// src/config.ts
import * as appConfig from "../config.json";
import { Config, configDefaults } from "@fewlines/fwl-config";

const config: Config = { ...configDefaults, ...appConfig };

export default config;
```

You could also extend the `Config` type for your service needs:

```typescript
// src/config.ts
import * as appConfig from "../config.json";
import { Config, configDefaults } from "@fewlines/fwl-config";

interface MyServiceConfig extends Config {
  services: {
    otherServiceUrl: string;
  };
}

const config: MyServiceConfig = { ...configDefaults, ...appConfig };

export default config;
```
