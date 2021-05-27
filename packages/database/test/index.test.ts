import { InMemoryTracer } from "@fwl/tracing";

import * as database from "../index";

let db: database.DatabaseQueryRunner;
let tracer: InMemoryTracer;
beforeAll(async () => {
  tracer = new InMemoryTracer();
  db = await database.connectInSandbox({
    username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
    host: process.env.DATABASE_SQL_HOST || "localhost",
    password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
    database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
    port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
  });
  await db.query(
    "CREATE TABLE IF NOT EXISTS fwl (id UUID PRIMARY KEY, name varchar(32) NOT NULL)",
  );
});
beforeEach(async () => {
  // await db.query("TRUNCATE fwl");
  tracer.spans = [];
});

afterAll(async () => {
  // await db.query("DROP TABLE fwl");
  await db.close();
});

test("it should connect and get data", async () => {
  expect.assertions(2);
  await db.query("INSERT INTO fwl (id, name) VALUES($1, $2)", [
    "74fbf638-6241-42bd-b257-b9a3dd24feb6",
    "test",
  ]);
  const { rows } = await db.query("SELECT * FROM fwl");
  expect(rows.length).toBe(1);
  expect(rows[0].name).toBe("test");
});

describe("transactions", () => {
  test("a transaction should be commited if all works", async () => {
    expect.assertions(2);
    try {
      await db.transaction(async (client) => {
        await client.query("INSERT INTO fwl (id, name) VALUES ($1, $2)", [
          "10f9a111-bf5c-4e73-96ac-5de87d962929",
          "in-transaction",
        ]);
      });
    } catch (error) {
      expect(error).not.toBeDefined();
    }

    const { rows } = await db.query("SELECT * FROM fwl WHERE name = $1", [
      "in-transaction",
    ]);
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("in-transaction");
  });

  test("a transaction should be able to return the result of the last returned query", async () => {
    expect.assertions(2);
    try {
      const { rows } = await db.transaction((client) => {
        return client.query(
          "INSERT INTO fwl (id, name) VALUES ($1, $2) RETURNING id, name",
          ["10f9a111-bf5c-4e73-96ac-5de87d962929", "in-transaction"],
        );
      });
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe("in-transaction");
    } catch (error) {
      expect(error).not.toBeDefined();
    }
  });

  test.only("we should be able to manually rollback a transaction", async () => {
    expect.assertions(2);
    try {
      await db.transaction(async (client) => {
        await client.query("INSERT INTO fwl (id, name) VALUES ($1, $2)", [
          "10f9a111-bf5c-4e73-96ac-5de87d962929",
          "in-transaction",
        ]);
        await client.query("ROLLBACK");
        return Promise.reject(Error("rollbacked"));
      });
    } catch (error) {
      console.log("✅", error);
      expect(error).toBeInstanceOf(database.TransactionError);
      expect(error.message).toBe("rollbacked");
    }

    const { rows } = await db.query("SELECT * FROM fwl WHERE name = $1", [
      "in-transaction",
    ]);
    expect(rows.length).toBe(0);
  });

  test("it should return a TransactionError if a transaction fails", async () => {
    expect.assertions(2);
    try {
      await db.transaction((client) =>
        client.query("INSERT INTO fwl (name) VALUES ($1)", ["fail"]),
      );
    } catch (error) {
      expect(error).toBeInstanceOf(database.TransactionError);
    }
    const { rows } = await db.query("SELECT * FROM fwl");
    expect(rows.length).toBe(0);
  });

  test("it should return a TransactionError if we try to get a transaction inside of a transaction", async () => {
    expect.assertions(2);
    const noOp = (): Promise<void> => Promise.resolve();
    try {
      await db.transaction((client) => client.transaction(noOp));
    } catch (error) {
      expect(error).toBeInstanceOf(database.TransactionError);
      expect(error.message).toBe(
        "Can't run a transaction inside another transaction",
      );
    }
  });

  test("it should return a TransactionError if we try to close the connection inside of a transaction", async () => {
    expect.assertions(2);
    try {
      await db.transaction((client) => client.close());
    } catch (error) {
      expect(error).toBeInstanceOf(database.TransactionError);
      expect(error.message).toBe(
        "Can't close a connection inside a transaction",
      );
    }
  });

  test("Should throw a DuplicateEntryError ", async () => {
    try {
      await db.query("INSERT INTO fwl (id, name) VALUES($1, $2)", [
        "74fbf638-6241-42bd-b257-b9a3dd24feb6",
        "test",
      ]);
      await db.query("INSERT INTO fwl (id, name) VALUES($1, $2)", [
        "74fbf638-6241-42bd-b257-b9a3dd24feb6",
        "test",
      ]);
    } catch (error) {
      expect(error).toBeInstanceOf(database.DuplicateEntryError);
    }
  });

  test("Should throw a BadUUIDError", async () => {
    try {
      await db.query("INSERT INTO fwl (id, name) VALUES($1, $2)", [
        "74fbf638-6241-42bd-b257-b9a3dd24feb",
        "test",
      ]);
    } catch (error) {
      expect(error).toBeInstanceOf(database.BadUUIDError);
    }
  });
});

describe("database tracing", () => {
  test("The query should generate a corresponding span with the right name and attributes", async () => {
    expect.assertions(3);
    await db.query("INSERT INTO fwl (id, name) VALUES ($1, $2)", [
      "74fbf638-6241-42bd-b257-b9a3dd24feb6",
      "test",
    ]);
    const spans = tracer.searchSpanByName("db-query");
    expect(spans.length).toBe(1);
    const span = spans[0];
    expect(span.name).toBe("db-query");
    expect(span.attributes["db.statement"]).toBe(
      "INSERT INTO fwl (id, name) VALUES ($1, $2)",
    );
  });

  test("The transaction and associated query should generate the corresponding span with the right name and attributes", async () => {
    expect.assertions(5);
    await db.transaction(async (client) => {
      await client.query("INSERT INTO fwl (id, name) VALUES ($1, $2)", [
        "10f9a111-bf5c-4e73-96ac-5de87d962929",
        "in-transaction",
      ]);
    });
    const transactionSpan = tracer.searchSpanByName("db-transaction")[0];
    expect(transactionSpan).toBeDefined();
    expect(transactionSpan.name).toBe("db-transaction");
    const querySpan = tracer.searchSpanByName("db-query")[0];
    expect(querySpan).toBeDefined();
    expect(querySpan.name).toBe("db-query");
    expect(querySpan.attributes["db.statement"]).toBe(
      "INSERT INTO fwl (id, name) VALUES ($1, $2)",
    );
  });

  test("Closing the connection should generate the related span", async () => {
    const testDb = database.connect(tracer, {
      username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
      host: process.env.DATABASE_SQL_HOST || "localhost",
      password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
      database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
      port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
    });
    await testDb.close();
    const closeSpan = tracer.searchSpanByName("db-close")[0];
    expect(closeSpan).toBeDefined();
    expect(closeSpan.name).toBe("db-close");
  });
});
