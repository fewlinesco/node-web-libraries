import * as database from "../index";

let db: database.DatabaseQueryRunner;

beforeEach(async () => {
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

afterEach(async () => {
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

  test("we should be able to manually rollback a transaction by throwing an error", async () => {
    expect.assertions(3);
    try {
      await db.transaction(async (client) => {
        await client.query("INSERT INTO fwl (id, name) VALUES ($1, $2)", [
          "10f9a111-bf5c-4e73-96ac-5de87d962929",
          "in-transaction",
        ]);
        return Promise.reject(Error("rollbacked"));
      });
    } catch (error) {
      expect(error).toBeInstanceOf(database.TransactionError);
      expect(error.message).toBe("rollbacked");
    }

    const { rows } = await db.query("SELECT * FROM fwl WHERE name = $1", [
      "in-transaction",
    ]);
    expect(rows.length).toBe(0);
  });

  test("we should be able to manually rollback a transaction using the rollback function", async () => {
    expect.assertions(1);
    await db.transaction(async (client) => {
      await client.query("INSERT INTO fwl (id, name) VALUES ($1, $2)", [
        "10f9a111-bf5c-4e73-96ac-5de87d962929",
        "in-transaction",
      ]);
      await client.rollback();
    });

    const { rows } = await db.query("SELECT * FROM fwl WHERE name = $1", [
      "in-transaction",
    ]);
    expect(rows.length).toBe(0);
  });

  test("it should return a TransactionError if we try to manually rollback a transaction by querying a ROLLBACK", async () => {
    expect.assertions(3);
    try {
      await db.transaction(async (client) => {
        await client.query("INSERT INTO fwl (id, name) VALUES ($1, $2)", [
          "10f9a111-bf5c-4e73-96ac-5de87d962929",
          "in-transaction",
        ]);
        await client.query("ROLLBACK");
      });
    } catch (error) {
      expect(error).toBeInstanceOf(database.TransactionError);
      expect(error.message).toBe(
        "Can't query ROLLBACK inside of a `transaction` function, please throw an error or use transactionClient.rollback()",
      );
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
