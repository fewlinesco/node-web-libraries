// import { configDefaults } from "@fewlines/fwl-config";
import * as database from "@fewlines/fwl-database";

import { runMigrations } from "../index";

let db: database.DatabaseQueryRunner;
beforeAll(async () => {
  db = database.connect({
    username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
    host: process.env.DATABASE_SQL_HOST || "localhost",
    password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
    database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
    port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
  });

  await db.query("DROP TABLE IF EXISTS schema_migrations");
  await db.query("DROP TABLE IF EXISTS profiles");
  await db.query("DROP TABLE IF EXISTS posts");
  await db.query("DROP TABLE IF EXISTS users");

  await db.close();
});

afterAll(async () => {
  db = database.connect({
    username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
    host: process.env.DATABASE_SQL_HOST || "localhost",
    password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
    database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
    port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
  });
  await db.query("DROP TABLE IF EXISTS schema_migrations");
  await db.query("DROP TABLE IF EXISTS profiles");
  await db.query("DROP TABLE IF EXISTS posts");
  await db.query("DROP TABLE IF EXISTS users");

  await db.close();
});

describe("runMigrations", () => {
  const testConfig = {
    database: {
      database: "fwl_db",
      password: "fwl_db",
      username: "fwl_db",
      host: "localhost",
      port: 5432,
    },
    http: {
      port: 50100,
    },
    tracing: {
      serviceName: "",
    },
    migration: {
      dirPath: "./test/migrations",
    },
  };

  it("takes a config json as parameter", async (done) => {
    await runMigrations(testConfig);

    const db = database.connect({
      username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
      host: process.env.DATABASE_SQL_HOST || "localhost",
      password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
      database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
      port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
    });

    const { rows } = await db.query("SELECT * FROM schema_migrations");

    expect(rows.length).toEqual(3);

    await db.close();

    done();
  });

  // it("takes insert each migrations", async () => {
  //   await runMigrations(testConfig);

  //   const db = database.connect({
  //     username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
  //     host: process.env.DATABASE_SQL_HOST || "localhost",
  //     password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
  //     database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
  //     port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
  //   });

  //   const { rows } = await db.query("SELECT * FROM schema_migrations");
  //   const tableNames = ["users", "profiles", "posts"];

  //   expect(rows.length).toEqual(3);

  //   tableNames.forEach((tableName, index) => {
  //     expect(tableName).toEqual([index])
  //   });

  //   for (const tableName in tableNames) {
  //     expect(tableName).toEqual
  //   }

  //   await db.close();
  // });
});
