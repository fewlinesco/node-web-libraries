import * as database from "@fewlines/fwl-database";

import { runMigrations } from "../index";
import { getConfig } from "../utils/getConfig";

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
  it("takes a config json as parameter", async (done) => {
    expect.assertions(1);

    const config = await getConfig("./test/config.json");

    await runMigrations(config);

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

  it("takes insert each migrations", async (done) => {
    expect.assertions(1);

    const config = await getConfig("./test/config.json");

    await runMigrations(config);

    const db = database.connect({
      username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
      host: process.env.DATABASE_SQL_HOST || "localhost",
      password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
      database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
      port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
    });

    const dbTables = await db.transaction(async (client) => {
      const schemaMigrationsTable = await client.query("SELECT * FROM users");
      const usersTable = await client.query("SELECT * FROM users");
      const profilesTable = await client.query("SELECT * FROM profiles");
      const postsTable = await client.query("SELECT * FROM posts");

      return [schemaMigrationsTable, usersTable, profilesTable, postsTable];
    });

    expect(dbTables.length).toEqual(4);

    await db.close();

    done();
  });
});
