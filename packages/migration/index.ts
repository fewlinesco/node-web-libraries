import { Config as DefaultConfig } from "@fewlines/fwl-config";
import * as database from "@fewlines/fwl-database";
import * as fs from "fs";
import * as path from "path";
import { getConfig } from "utils/getConfig";
import { v4 as uuidv4 } from "uuid";

import { createSchemaMigrationsTable } from "./utils/createSchemaMigrationsTable";
import { createTimestamp } from "./utils/createTimestamp";
import { getLastMigration } from "./utils/getLastMigration";
import { getPendingMigrations } from "./utils/getPendingMigrations";
import { getQueries } from "./utils/getQueries";

export type Query = {
  timestamp: string;
  query: string;
  fileName: string;
};

export interface MigrateConfig extends DefaultConfig {
  migration: {
    dirPath?: string;
  };
}

export async function runMigrations(config: MigrateConfig): Promise<void> {
  const databaseQueryRunner: database.DatabaseQueryRunner = database.connect(
    config.database,
  );

  const sqlMigrationsFolder = config.migration.dirPath || "./migrations";

  try {
    const queries = await getQueries(sqlMigrationsFolder);

    await createSchemaMigrationsTable(databaseQueryRunner);

    const lastMigrationRan = await getLastMigration(databaseQueryRunner);

    const pendingMigrations = lastMigrationRan
      ? getPendingMigrations(queries, lastMigrationRan.version)
      : queries;

    for await (const { timestamp, fileName, query } of pendingMigrations) {
      await databaseQueryRunner.transaction(async (client) => {
        try {
          await client.query(query);

          await client.query(
            `INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4)`,
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

export async function createMigrationFile(name: string): Promise<void> {
  const targetDir = path.join(process.cwd(), "./migrations");
  const fileName = `${createTimestamp(new Date())}-${name}.sql`;

  if (!fs.existsSync(targetDir)) {
    fs.promises.mkdir(targetDir);

    console.log(`${targetDir} has been created`);
  }

  fs.open(`${targetDir + "/" + fileName}`, "wx", (error) => {
    if (error) throw error;

    console.log(`${fileName} has been created in ${targetDir}`);
  });
}
