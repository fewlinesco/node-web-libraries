import * as database from "../index";

let db: database.DatabaseQueryRunner;
beforeAll(async () => {
  db = database.connect({
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
beforeEach(() => db.query("TRUNCATE fwl"));

afterAll(async () => {
  await db.query("DROP TABLE fwl");
  await db.close();
});

test("it should connect and get data", async () => {
  await db.query("INSERT INTO fwl (id, name) VALUES($1, $2)", [
    "74fbf638-6241-42bd-b257-b9a3dd24feb6",
    "test",
  ]);
  const { rows } = await db.query("SELECT * FROM fwl");
  expect(rows.length).toBe(1);
  expect(rows[0].name).toBe("test");
});

test("a transaction should be commited if all works", async () => {
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

test("we should be able to manually rollback a transaction", async () => {
  try {
    await db.transaction(async (client) => {
      await client.query("INSERT INTO fwl (id, name) VALUES ($1, $2)", [
        "10f9a111-bf5c-4e73-96ac-5de87d962929",
        "in-transaction",
      ]);
      await client.query("ROLLBACK");
    });
  } catch (error) {
    expect(error).not.toBeDefined();
  }

  const { rows } = await db.query("SELECT * FROM fwl WHERE name = $1", [
    "in-transaction",
  ]);
  expect(rows.length).toBe(0);
});

test("it should return a TransactionError if a transaction fails", async () => {
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
