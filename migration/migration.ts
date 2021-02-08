import * as database from "@fwl/database";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

import { RunMigrationsConfig } from "./config/config";
import { createSchemaMigrationsTable } from "./utils/createSchemaMigrationsTable";
import { createTimestamp } from "./utils/createTimestamp";
import { getPendingMigrations } from "./utils/getPendingMigrations";
import { getQueries } from "./utils/getQueries";

type Query = {
  timestamp: string;
  query: string;
  fileName: string;
};

type SchemaMigrationsRow = {
  id: string;
  version: string;
  file_name: string;
  query: string;
  created_at: string;
};

async function runMigrations(config: RunMigrationsConfig): Promise<void> {
  const databaseQueryRunner: database.DatabaseQueryRunnerWithoutTracing = database.connectWithoutTracing(
    config.database,
  );

  const sqlMigrationsFolder = config.migration.dirPath || "./migrations";
  const tableName = config.migration.tableName || "schema_migrations";
  try {
    const queries = await getQueries(sqlMigrationsFolder);

    await createSchemaMigrationsTable(databaseQueryRunner, tableName);

    const { rows } = await databaseQueryRunner.query(
      `SELECT * FROM ${tableName} ORDER BY created_at DESC`,
    );

    const pendingMigrations = rows
      ? getPendingMigrations(rows, queries)
      : queries;

    for await (const { timestamp, fileName, query } of pendingMigrations) {
      await databaseQueryRunner.transaction(async (client) => {
        try {
          await client.query(query);

          await client.query(
            `INSERT INTO ${tableName} (id, version, file_name, query) VALUES ($1, $2, $3, $4)`,
            [uuidv4(), timestamp, fileName, query],
          );
        } catch (error) {
          client.query("ROLLBACK");
          throw new Error(error);
        }
      });
    }
  } catch (error) {
    console.error(error);
  }

  databaseQueryRunner.close();
}

async function createMigrationFile(
  name: string,
  migrationPath?: string,
): Promise<string> {
  const configuredPath = migrationPath ? migrationPath : "./migrations";

  const targetDir = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);

  const fileName = `${createTimestamp(new Date())}-${name}.sql`;

  if (!fs.existsSync(targetDir)) {
    await fs.promises.mkdir(targetDir);

    console.log(`${targetDir} has been created`);
  }

  fs.open(`${targetDir + "/" + fileName}`, "wx", (error) => {
    if (error) throw error;

    console.log(`${fileName} has been created in ${targetDir}`);
  });

  return fileName;
}

async function dryRunPendingMigrations(
  config: RunMigrationsConfig,
): Promise<void> {
  const databaseQueryRunner: database.DatabaseQueryRunnerWithoutTracing = database.connectWithoutTracing(
    config.database,
  );

  const sqlMigrationsFolder = config.migration.dirPath || "./migrations";
  const tableName = config.migration.tableName || "schema_migrations";

  try {
    const queries = await getQueries(sqlMigrationsFolder);

    await createSchemaMigrationsTable(databaseQueryRunner, tableName);

    const { rows } = await databaseQueryRunner.query(
      `SELECT * FROM ${tableName} ORDER BY created_at DESC`,
    );

    const pendingMigrations = rows
      ? getPendingMigrations(rows, queries)
      : queries;

    await databaseQueryRunner.transaction(async (client) => {
      for await (const { timestamp, fileName, query } of pendingMigrations) {
        try {
          await client.query(query);

          await client.query(
            `
            INSERT INTO ${tableName} (id, version, file_name, query) VALUES ($1, $2, $3, $4)`,
            [uuidv4(), timestamp, fileName, query],
          );
        } catch (error) {
          client.query("ROLLBACK");
          throw error;
        }
      }

      await client.query("ROLLBACK");
      console.log("Migration dry run success !");
    });
  } catch (error) {
    await databaseQueryRunner.close();
    throw error;
  }

  return databaseQueryRunner.close();
}

export {
  createMigrationFile,
  dryRunPendingMigrations,
  Query,
  runMigrations,
  SchemaMigrationsRow,
};
