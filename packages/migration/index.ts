import { Config as DefaultConfig } from "@fewlines/fwl-config";
import * as database from "@fewlines/fwl-database";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

import { createSchemaMigrationsTable } from "./utils/createSchemaMigrationsTable";
import { createTimestamp } from "./utils/createTimestamp";
import { getConfig } from "./utils/getConfig";
import { getQueries } from "./utils/getQueries";
import { getUnranMigrations } from "./utils/getUnranMigrations";

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

export type SchemaMigrationsRow = {
  id: string;
  version: string;
  file_name: string;
  query: string;
  created_at: string;
};

export async function runMigrations(config?: MigrateConfig): Promise<void> {
  const checkedConfig = config ? config : await getConfig();

  const databaseQueryRunner: database.DatabaseQueryRunner = database.connect(
    checkedConfig.database,
  );

  const sqlMigrationsFolder = checkedConfig.migration.dirPath || "./migrations";

  try {
    const queries = await getQueries(sqlMigrationsFolder);

    await createSchemaMigrationsTable(databaseQueryRunner);

    const { rows } = await databaseQueryRunner.query(
      "SELECT * FROM schema_migrations ORDER BY created_at DESC",
    );

    const unranMigrations = rows ? getUnranMigrations(rows, queries) : queries;

    for await (const { timestamp, fileName, query } of unranMigrations) {
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
  const config = await getConfig();

  const targetDir = path.join(
    process.cwd(),
    config ? config.migration.dirPath : "./migrations",
  );

  const fileName = `${createTimestamp(new Date())}-${name}.sql`;

  if (!fs.existsSync(targetDir)) {
    await fs.promises.mkdir(targetDir);

    console.log(`${targetDir} has been created`);
  }

  fs.open(`${targetDir + "/" + fileName}`, "wx", (error) => {
    if (error) throw error;

    console.log(`${fileName} has been created in ${targetDir}`);
  });
}
