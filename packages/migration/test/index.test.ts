import * as database from "@fwl/database";
import * as fs from "fs";
import * as path from "path";

import { runMigrations, dryRunPendingMigrations } from "../index";
import { getConfig } from "../utils/getConfig";
import { getQueries } from "../utils/getQueries";

jest.mock("../utils/getConfig", () => {
  const cleanConfigPath = path.join(process.cwd(), "./test/config.json");

  return {
    getConfig: async () =>
      await fs.promises
        .readFile(path.join(cleanConfigPath), "utf-8")
        .then(JSON.parse)
        .catch((error) => console.log(error)),
  };
});

let db: database.DatabaseQueryRunnerWithoutTracing;
beforeAll(async () => {
  db = database.connectWithoutTracing({
    username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
    host: process.env.DATABASE_SQL_HOST || "localhost",
    password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
    database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
    port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
  });

  await db.query("DROP TABLE IF EXISTS schema_migrations");
  await db.query("DROP TABLE IF EXISTS profiles");
  await db.query("DROP TABLE IF EXISTS posts");
  await db.query("DROP TABLE IF EXISTS rogues");
  await db.query("DROP TABLE IF EXISTS users");

  await db.close();
});

afterAll(async () => {
  db = database.connectWithoutTracing({
    username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
    host: process.env.DATABASE_SQL_HOST || "localhost",
    password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
    database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
    port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
  });
  await db.query("DROP TABLE IF EXISTS schema_migrations");
  await db.query("DROP TABLE IF EXISTS profiles");
  await db.query("DROP TABLE IF EXISTS posts");
  await db.query("DROP TABLE IF EXISTS rogues");
  await db.query("DROP TABLE IF EXISTS users");

  await db.close();
});

describe("runMigrations", () => {
  it("takes a config json as parameter", async (done) => {
    expect.assertions(4);

    const config = await getConfig("./test/config.json");

    await runMigrations(config);

    const db = database.connectWithoutTracing(config.database);

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

    const db = database.connectWithoutTracing(config.database);

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

    const db = database.connectWithoutTracing(config.database);

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

  it("runs unrun migrations, prior to the last one ran", async (done) => {
    expect.assertions(3);

    const config = await getConfig("./test/config.json");

    await runMigrations();

    const db = database.connectWithoutTracing(config.database);

    const { rows } = await db.query("SELECT * FROM schema_migrations");

    expect(rows.length).toEqual(3);

    const targetDir = path.join(
      process.cwd(),
      config ? config.migration.dirPath : "./migrations",
    );

    const fileName = "20200511073350-rogue_migrations.sql";

    const queryContent = `CREATE TABLE "rogues" ("id" uuid NOT NULL, "created_at" timestamp NOT NULL DEFAULT NOW(), "updated_at" timestamp NOT NULL DEFAULT NOW(), PRIMARY KEY ("id"));`;

    await fs.promises
      .appendFile(`${targetDir + "/" + fileName}`, `${queryContent}`)
      .catch((error) => console.log(error));

    const updatedMigrationsFolder = await getQueries(config.migration.dirPath);

    expect(updatedMigrationsFolder.length).toEqual(4);

    await runMigrations();

    await fs.promises
      .unlink(`${config.migration.dirPath}/${fileName}`)
      .catch((error) => console.log(error));

    const { rows: updatedRows } = await db.query(
      "SELECT * FROM schema_migrations",
    );

    await db.close();

    expect(updatedRows.length).toEqual(4);

    done();
  });

  it("runs pending migrations in a transaction and rollback afterwards", async (done) => {
    expect.assertions(1);

    const config = await getConfig("./test/config.json");

    await runMigrations();

    const db = database.connectWithoutTracing(config.database);

    const { rows } = await db.query("SELECT * FROM schema_migrations");

    const currentMigrationNumber = rows.length;

    const targetDir = path.join(
      process.cwd(),
      config ? config.migration.dirPath : "./migrations",
    );

    const fileName = "20200511073360-good_migration.sql";

    const queryContent = `CREATE TABLE "good" ("id" uuid NOT NULL, "created_at" timestamp NOT NULL DEFAULT NOW(), "updated_at" timestamp NOT NULL DEFAULT NOW(), PRIMARY KEY ("id"));`;

    await fs.promises
      .appendFile(`${targetDir + "/" + fileName}`, `${queryContent}`)
      .catch((error) => console.log(error));

    await dryRunPendingMigrations(config);

    await fs.promises
      .unlink(`${config.migration.dirPath}/${fileName}`)
      .catch((error) => console.log(error));

    const { rows: updatedRows } = await db.query(
      "SELECT * FROM schema_migrations",
    );
    expect(currentMigrationNumber).toEqual(updatedRows.length);

    done();
  });

  it("runs pending migrations with one containing an error, rollbacks then throw the error", async (done) => {
    expect.assertions(2);

    const config = await getConfig("./test/config.json");

    await runMigrations();

    const targetDir = path.join(
      process.cwd(),
      config ? config.migration.dirPath : "./migrations",
    );

    const fileName = "20200511073360-bad_migration.sql";

    const queryContent = `CREATE TABLE "bad" ("id" badtype NOT NULL, "created_at" timestamp NOT NULL DEFAULT NOW(), "updated_at" timestamp NOT NULL DEFAULT NOW(), PRIMARY KEY ("id"));`;

    await fs.promises
      .appendFile(`${targetDir + "/" + fileName}`, `${queryContent}`)
      .catch((error) => console.log(error));

    try {
      await dryRunPendingMigrations(config);
    } catch (error) {
      expect(error).toBeInstanceOf(database.TransactionError);
      expect(error.message).toBe(`type "badtype" does not exist`);
    }

    await fs.promises
      .unlink(`${config.migration.dirPath}/${fileName}`)
      .catch((error) => console.log(error));

    done();
  });
});
