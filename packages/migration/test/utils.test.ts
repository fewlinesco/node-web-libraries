import * as database from "@fwl/database";
import * as path from "path";

import { createSchemaMigrationsTable } from "../utils/createSchemaMigrationsTable";
import { getConfig } from "../utils/getConfig";
import { getQueries } from "../utils/getQueries";

let db: database.DatabaseQueryRunnerWithoutTracing;
beforeAll(async (done) => {
  db = database.connectWithoutTracing({
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

  it("can get the config from an absolute path", async (done) => {
    expect.assertions(1);
    const configPath = path.join(process.cwd(), "/test/config.json");

    const config = await getConfig(configPath);

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
