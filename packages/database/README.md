# FWL Database

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

It provides an interface other a postgres Pool.

## Installation

```shell
yarn add @fewlines/fwl-database
```

## Usage

You first need to create a new `DatabaseQueryRunner`:

```typescript
import * as database from "@fewlines/fwl-database";

// config.database should come from an implementation of @fewlines/fwl-config
const databaseQueryRunner: database.DatabaseQueryRunner = 
  database.connect(config.database);
```

`DatabaseQueryRunner` gives you two methods: `query` and `close`.

`close` does not take any argument and return a `Promise<void>` indicating that the connection has successfully been closed.

`query` takes a query and a list of values:

```typescript
databaseQueryRunner.query("SELECT * FROM my_table WHERE id = $1", [id])
```

This function follows the same logic as the underlying [node-pg](https://node-postgres.com/features/queries) package.
