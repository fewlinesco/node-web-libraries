import * as database from "@fwl/database";
import { DatabaseQueryRunner } from "@fwl/database";
import * as fs from "fs";
import * as path from "path";

import {
  runMigrations,
  dryRunPendingMigrations,
  RunMigrationsConfig,
} from "../index";
import { getConfig } from "../utils/getConfig";
import { getQueries } from "../utils/getQueries";

jest.mock("../utils/getConfig", () => {
  const cleanConfigPath = path.join(process.cwd(), "./test/config.json");

  return {
    getConfig: async () =>
      fs.promises
        .readFile(path.join(cleanConfigPath), "utf-8")
        .then(JSON.parse)
        .catch((error) => console.log(error)),
  };
});

async function cleanDatabase(database: DatabaseQueryRunner): Promise<void> {
  const { rows } = await database.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  for await (const tableName of rows.map(({ table_name }) => table_name)) {
    await database.query(`DROP TABLE IF EXISTS ${tableName}`);
  }
}

describe("runMigrations", () => {
  let db: database.DatabaseQueryRunner;
  let config: RunMigrationsConfig;

  beforeAll(async () => {
    config = await getConfig("./test/config.json");

    db = database.connectWithoutTracing({
      username: process.env.DATABASE_SQL_USERNAME || "fwl_db",
      host: process.env.DATABASE_SQL_HOST || "localhost",
      password: process.env.DATABASE_SQL_PASSWORD || "fwl_db",
      database: process.env.DATABASE_SQL_DATABASE || "fwl_db",
      port: parseFloat(process.env.DATABASE_SQL_PORT) || 5432,
    });
  });

  beforeEach(async () => cleanDatabase(db));

  afterAll(async () => {
    await cleanDatabase(db);
    db.close();
  });

  it("takes a config json with 'DatabaseConfig' database as parameter", async () => {
    expect.assertions(4);

    await runMigrations(config);

    const { rows } = await db.query("SELECT * FROM schema_migrations");

    expect(rows.length).toEqual(3);

    const queries = await getQueries("./test/migrations");

    rows.forEach(({ version }, index) => {
      expect(version).toEqual(queries[index].timestamp);
    });
  });

  it("takes a config json with 'DatabaseConfigWithDatabaseUrl' database as parameter", async () => {
    expect.assertions(4);

    const withUrlConfig = {
      database: {
        url: `postgres://${process.env.DATABASE_SQL_USERNAME || "fwl_db"}:${
          process.env.DATABASE_SQL_PASSWORD || "fwl_db"
        }@${process.env.DATABASE_SQL_HOST || "localhost"}:${
          process.env.DATABASE_SQL_PORT || 5432
        }/${process.env.DATABASE_SQL_DATABASE || "fwl_db"}`,
      },
      migration: config.migration,
    };

    await runMigrations(withUrlConfig);

    const { rows } = await db.query("SELECT * FROM schema_migrations");

    expect(rows.length).toEqual(3);

    const queries = await getQueries("./test/migrations");

    rows.forEach(({ version }, index) => {
      expect(version).toEqual(queries[index].timestamp);
    });
  });

  it("does each migrations if used as a custom implementation", async () => {
    expect.assertions(5);

    await runMigrations(config);

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
  });

  it("does each migrations in a custom table if configured", async () => {
    expect.assertions(5);

    const customConfig = await getConfig("./test/migrations");

    customConfig.migration.tableName = "custom_schema_migrations";

    await runMigrations(customConfig);

    const dbTables = await db.transaction(async (client) => {
      try {
        const schemaMigrationsTable = await client.query(
          "SELECT * FROM custom_schema_migrations",
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
  });

  it("does each migrations if used as a CLI", async () => {
    expect.assertions(5);

    await runMigrations(config);

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
  });

  it("runs unrun migrations, prior to the last one ran", async () => {
    expect.assertions(3);

    await runMigrations(config);

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

    await runMigrations(config);

    await fs.promises
      .unlink(`${config.migration.dirPath}/${fileName}`)
      .catch((error) => console.log(error));

    const { rows: updatedRows } = await db.query(
      "SELECT * FROM schema_migrations",
    );

    expect(updatedRows.length).toEqual(4);
  });

  it("runs pending migrations in a transaction and rollback afterwards", async () => {
    const spyLog = jest.spyOn(console, "log").mockImplementation(jest.fn());
    expect.assertions(1);

    await runMigrations(config);

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
      .catch((error) => {
        console.log(error);
        throw error;
      });

    await dryRunPendingMigrations(config);

    await fs.promises
      .unlink(`${config.migration.dirPath}/${fileName}`)
      .catch((error) => console.log(error));

    const { rows: updatedRows } = await db.query(
      "SELECT * FROM schema_migrations",
    );
    expect(currentMigrationNumber).toEqual(updatedRows.length);
    spyLog.mockRestore();
  });

  it("runs pending migrations with one containing an error, rollbacks then throw the error", async () => {
    expect.assertions(2);

    await runMigrations(config);

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
      .catch((error) => fail(error));
  });
});
