import { InMemoryTracer } from "@fwl/tracing";

import * as database from "../index";

let db: database.DatabaseQueryRunner;
let tracer: InMemoryTracer;

const databaseConfig = {
  url: `postgres://${process.env.DATABASE_SQL_USERNAME || "fwl_db"}:${
    process.env.DATABASE_SQL_PASSWORD || "fwl_db"
  }@${process.env.DATABASE_SQL_HOST || "localhost"}:${
    process.env.DATABASE_SQL_PORT || 5432
  }/${process.env.DATABASE_SQL_DATABASE || "fwl_db"}`,
};

beforeAll(async () => {
  tracer = new InMemoryTracer();
  db = database.connect(tracer, databaseConfig);
  await db.query(
    "CREATE TABLE IF NOT EXISTS fwl (id UUID PRIMARY KEY, name varchar(32) NOT NULL)",
  );
});

beforeEach(async () => {
  await db.query("TRUNCATE fwl");
  tracer.spans = [];
});

afterAll(async () => {
  await db.query("DROP TABLE fwl");
  await db.close();
});

describe("With 'databaseUrl' in config", () => {
  it("Should connect and get data when provided with a databaseUrl config", async () => {
    expect.assertions(2);
    await db.query("INSERT INTO fwl (id, name) VALUES($1, $2)", [
      "74fbf638-6241-42bd-b257-b9a3dd24feb6",
      "test",
    ]);
    const { rows } = await db.query("SELECT * FROM fwl");
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("test");
  });
});
