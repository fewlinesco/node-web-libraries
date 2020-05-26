import * as database from "@fewlines/fwl-database";

import { createSchemaMigrationsTable } from "../utils/createSchemaMigrationsTable";
import { getConfig } from "../utils/getConfig";
import { getLastMigration } from "../utils/getLastMigration";
import { getPendingMigrations } from "../utils/getPendingMigrations";
import { getQueries } from "../utils/getQueries";

let db: database.DatabaseQueryRunner;
beforeAll(async (done) => {
  db = database.connect({
    username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
    host: process.env.DATABASE_SQL_HOST || "localhost",
    password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
    database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
    port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
  });

  await createSchemaMigrationsTable(db);

  done();
});
beforeEach(() => db.query("TRUNCATE schema_migrations"));

afterAll(async (done) => {
  await db.query("DROP TABLE schema_migrations");
  await db.close();

  done();
});

it("should connect and get data", async (done) => {
  expect.assertions(4);

  const {
    rows,
  } = await db.query(
    "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4) RETURNING *",
    ["c574af57-3e92-437f-9312-3090e113a3a5", "01234567891011", "test", "query"],
  );

  expect(rows.length).toBe(1);
  expect(rows[0].version).toBe("01234567891011");
  expect(rows[0].file_name).toBe("test");
  expect(rows[0].query).toBe("query");

  done();
});

describe("getLastMigration", () => {
  it("returns the last migration", async (done) => {
    expect.assertions(1);

    const queries: [string, string[]][] = [
      [
        "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4)",
        [
          "74fbf638-6241-42bd-b257-b9a3dd24feb6",
          "01234567891011",
          "first migration",
          "query",
        ],
      ],
      [
        "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4)",
        [
          "f4afc55f-1c03-4f08-8750-ab92e106b606",
          "01234567891011",
          "second migration",
          "query",
        ],
      ],
      [
        "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4)",
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

    const lastMigrationRan = await getLastMigration(db);

    expect(lastMigrationRan.file_name).toBe("third migration");

    done();
  });
});

describe("getQueries", () => {
  it("gets the queries from the migrations folder", async (done) => {
    expect.assertions(1);

    const queries = await getQueries("./test/migrations");

    expect(queries.length).toEqual(3);

    done();
  });

  it("keeps the migrations timestamp order", async (done) => {
    expect.assertions(3);

    const queries = await getQueries("./test/migrations");
    const timestamps = ["20200511072746", "20200511073348", "20200511073458"];

    queries.forEach((query, index) => {
      const { timestamp } = query;

      expect(timestamp).toBe(timestamps[index]);
    });

    done();
  });
});

describe("getPendingMigrations", () => {
  it("gets the pending migrations and keep the order", async (done) => {
    expect.assertions(3);

    const [query, arg]: [string, string[]] = [
      "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4)",
      [
        "03523136-6f2f-40da-b441-ac9f6f994019",
        "20200511072746",
        "20200511072746-create-users",
        "query",
      ],
    ];

    await db.query(query, arg);

    const queries = await getQueries("./test/migrations");

    const lastMigrationRan = await getLastMigration(db);

    const pendingMigrations = lastMigrationRan
      ? getPendingMigrations(queries, lastMigrationRan.version)
      : queries;

    expect(pendingMigrations.length).toEqual(2);

    pendingMigrations.forEach((pendingMigration, index) => {
      expect(pendingMigration.timestamp).toEqual(queries[index + 1].timestamp);
    });

    done();
  });
});

describe("getConfig", () => {
  it("gets the config from the path", async (done) => {
    expect.assertions(1);

    const config = await getConfig("./test/config.json");

    const testConfig = {
      database: {
        database: "fwl_db",
        password: "fwl_db",
        username: "fwl_db",
        host: "localhost",
        port: 5432,
      },
      http: { port: 50100 },
      tracing: { serviceName: "" },
      migration: { dirPath: "./test/migrations" },
    };

    expect(config).toEqual(testConfig);

    done();
  });
});
