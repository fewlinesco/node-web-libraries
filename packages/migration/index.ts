import * as database from "@fewlines/fwl-database";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

import { createSchemaMigrationsTable } from "./utils/createSchemaMigrationsTable";
import { getLastMigration } from "./utils/getLastMigration";
import { getPendingMigrations } from "./utils/getPendingMigrations";

export type Query = {
  timestamp: string;
  query: string;
  fileName: string;
};

export type Config = {
  database: {
    database: string;
    host: string;
    password: string;
    port: number;
    username: string;
  };
  http: {
    port: number;
  };
  tracing: {
    serviceName: string;
  };
  migration: {
    dirPath?: string;
  };
};

export async function runMigrations(config: Config): Promise<void> {
  const databaseQueryRunner: database.DatabaseQueryRunner = database.connect(
    config.database,
  );

  const sqlMigrationsFolder = config.migration.dirPath || "./migrations";

  try {
    const migrationsFiles = await fs.promises.readdir(sqlMigrationsFolder);

    const filteredMigrationFiles = migrationsFiles
      .filter((file) => path.extname(file).toLowerCase() === ".sql")
      .sort();

    const queries: Query[] = [];

    for await (const fileName of filteredMigrationFiles) {
      await fs.promises
        .readFile(`${sqlMigrationsFolder}/${fileName}`, "utf8")
        .then((query) => {
          const timestamp = fileName.split("-")[0];

          queries.push({
            timestamp,
            fileName,
            query,
          });
        });
    }

    createSchemaMigrationsTable(databaseQueryRunner);

    const lastMigrationRan = await getLastMigration(databaseQueryRunner);

    const pendingMigrations = getPendingMigrations(
      queries,
      lastMigrationRan.version,
    );

    for await (const { timestamp, fileName, query } of pendingMigrations) {
      await databaseQueryRunner.transaction(async (client) => {
        try {
          console.log(`\nRunning ${query}`);
          await client.query(query);

          console.log("Inserting row into schema_migrations table");
          await client.query(
            `INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4)`,
            [uuidv4(), timestamp, fileName, query],
          );

          console.log("Done.");
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
