import * as database from "@fewlines/fwl-database";
import { createSchemaMigrationsTable } from "../utils/createSchemaMigrationsTable";
import {
  getLastMigration,
  // SchemaMigrationsRow,
} from "../utils/getLastMigration";

let db: database.DatabaseQueryRunner;
beforeAll(async () => {
  db = database.connect({
    username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
    host: process.env.DATABASE_SQL_HOST || "localhost",
    password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
    database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
    port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
  });

  await createSchemaMigrationsTable(db);
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

describe("getLastMigration", () => {
  it("returns the last migration", async () => {
    expect.assertions(1);

    const queries: [string, string[]][] = [
      [
        "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4) RETURNING *",
        [
          "74fbf638-6241-42bd-b257-b9a3dd24feb6",
          "01234567891011",
          "first migration",
          "query",
        ],
      ],
      [
        "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4) RETURNING *",
        [
          "f4afc55f-1c03-4f08-8750-ab92e106b606",
          "01234567891011",
          "second migration",
          "query",
        ],
      ],
      [
        "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4) RETURNING *",
        [
          "37e2c486-0009-4b85-839a-1768bbd553ad",
          "01234567891011",
          "third migration",
          "query",
        ],
      ],
    ];

    for await (const [query, arg] of queries) {
      await db.transaction(async (client) => {
        try {
          await client.query(query, arg);
        } catch (error) {
          client.query("ROLLBACK");
          throw new Error(error);
        }
      });
    }

    const { rows } = await getLastMigration(db);

    const lastMigration = rows[0];

    expect(lastMigration.file_name).toBe("third migration");
  });
});
