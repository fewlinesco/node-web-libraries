import * as database from "@fewlines/fwl-database";

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
    `
      CREATE TABLE IF NOT EXISTS "schema_migrations" (
        "id" uuid NOT NULL,
        "version" varchar(14) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "query" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "updated_at" timestamp NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("id")
      );`,
  );
});
beforeEach(() => db.query("TRUNCATE schema_migrations"));

afterAll(async () => {
  await db.query("DROP TABLE schema_migrations");
  await db.close();
});

test("it should connect and get data", async () => {
  expect.assertions(4);
  const {
    rows,
  } = await db.query(
    "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4) RETURNING *",
    ["74fbf638-6241-42bd-b257-b9a3dd24feb6", "01234567891011", "test", "query"],
  );

  expect(rows.length).toBe(1);
  expect(rows[0].version).toBe("01234567891011");
  expect(rows[0].file_name).toBe("test");
  expect(rows[0].query).toBe("query");
});