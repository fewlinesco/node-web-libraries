import * as database from "@fewlines/fwl-database";
import * as fs from "fs";
import * as path from "path";

import { runMigrations } from "../index";
import { getConfig } from "../utils/getConfig";
import { getQueries } from "../utils/getQueries";

jest.mock("../utils/getConfig", () => {
  const cleanConfigPath = path.join(process.cwd(), "./test/config.json");

  return {
    getConfig: async () =>
      await fs.promises
        .readFile(path.join(cleanConfigPath), "utf-8")
        .then(JSON.parse),
  };
});

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
    expect.assertions(4);

    const config = await getConfig("./test/config.json");

    await runMigrations(config);

    const db = database.connect(config.database);

    const { rows } = await db.query("SELECT * FROM schema_migrations");

    expect(rows.length).toEqual(3);

    const queries = await getQueries("./test/migrations");

    rows.forEach(({ version }, index) => {
      expect(version).toEqual(queries[index].timestamp);
    });

    await db.close();

    done();
  });

  it("does each migrations if used as a custom implementation", async (done) => {
    expect.assertions(5);

    const config = await getConfig("./test/config.json");

    await runMigrations(config);

    const db = database.connect(config.database);

    const dbTables = await db.transaction(async (client) => {
      try {
        const schemaMigrationsTable = await client.query(
          "SELECT * FROM schema_migrations",
        );
        const usersTable = await client.query("SELECT * FROM users");
        const profilesTable = await client.query("SELECT * FROM profiles");
        const postsTable = await client.query("SELECT * FROM posts");

        expect(schemaMigrationsTable.rows.length).toBe(3);
        expect(usersTable.rows.length).toBe(0);
        expect(profilesTable.rows.length).toBe(0);
        expect(postsTable.rows.length).toBe(0);

        return [schemaMigrationsTable, usersTable, profilesTable, postsTable];
      } catch (error) {
        expect(error).not.toBeDefined();
      }
    });

    expect(dbTables.length).toEqual(4);

    await db.close();

    done();
  });

  it("does each migrations if used as a CLI", async (done) => {
    expect.assertions(5);

    await runMigrations();

    const config = await getConfig("./test/config.json");

    const db = database.connect(config.database);

    const dbTables = await db.transaction(async (client) => {
      try {
        const schemaMigrationsTable = await client.query(
          "SELECT * FROM schema_migrations",
        );
        const usersTable = await client.query("SELECT * FROM users");
        const profilesTable = await client.query("SELECT * FROM profiles");
        const postsTable = await client.query("SELECT * FROM posts");

        expect(schemaMigrationsTable.rows.length).toBe(3);
        expect(usersTable.rows.length).toBe(0);
        expect(profilesTable.rows.length).toBe(0);
        expect(postsTable.rows.length).toBe(0);

        return [schemaMigrationsTable, usersTable, profilesTable, postsTable];
      } catch (error) {
        expect(error).not.toBeDefined();
      }
    });

    expect(dbTables.length).toEqual(4);

    await db.close();

    done();
  });
});
