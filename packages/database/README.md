# FWL Database

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.

The database query runner provided by this package works in a similar way to the Pool entity from PostgreSQL

## Installation

```shell
yarn add @fwl/database
```

## Usage

You first need to create a new `DatabaseQueryRunner`:

```typescript
import * as database from "@fwl/database";

const databaseQueryRunner: database.DatabaseQueryRunner = database.connect(
  tracer,
  config
);
```

Tracing is activated by default and you require a tracer to pass to the `connect` method, if you wish to use this package without tracing enabled you can do so:

```typescript
import * as database from "@fwl/database";

const databaseQueryRunner: database.DatabaseQueryRunnerWithoutTracing = database.connectWithoutTracing(
  config
);
```

`DatabaseQueryRunner` gives you two methods: `query` and `close`.

`close` does not take any argument and return a `Promise<void>` indicating that the connection has successfully been closed.

`query` takes a query and a list of values:

```typescript
databaseQueryRunner.query("SELECT * FROM my_table WHERE id = $1", [id]);
```

This function follows the same logic as the underlying [node-pg](https://node-postgres.com/features/queries) package.

`transaction` takes a callback, and gives it a new `DatabaseQueryRunner` that will execute its queries inside the transaction.

```typescript
await databaseQueryRunner.transaction(async (client) => {
  await client.query("INSERT INTO my_table (id, name) VALUES ($1, $2)", [
    "10f9a111-bf5c-4e73-96ac-5de87d962929",
    "in-transaction",
  ]);
});
```

If you want to get the result of your transaction, you would need to return your query:

```typescript
const { rows } = await databaseQueryRunner.transaction((client) => {
  return client.query(
    "INSERT INTO my_table (id, name) VALUES ($1, $2) RETURNING id",
    ["10f9a111-bf5c-4e73-96ac-5de87d962929", "in-transaction"]
  );
});

// rows contains [{id: "10f9a111-bf5c-4e73-96ac-5de87d962929"}]
```

If you need to manually rollback a transaction, this is just another query:

```typescript
try {
  await databaseQueryRunner.transaction(async (client) => {
    await client.query("INSERT INTO my_table (id, name) VALUES ($1, $2)", [
      "10f9a111-bf5c-4e73-96ac-5de87d962929",
      "in-transaction",
    ]);
    const result = await callFromAnotherService();
    if (result.error) {
      await client.query("ROLLBACK");
      return Promise.reject(new Error("anotherService failed"));
    }
  });
} catch (error) {
  // typeof error === TransactionError
  // error.message === "anotherService failed"
}
```
