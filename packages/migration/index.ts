import * as database from "@fewlines/fwl-database";
import * as fs from "fs";
import * as path from "path";
// import { getPendingMigrations } from "utils/getPendingMigrations";
import { createSchemaMigrationsTable } from "utils/createSchemaMigrationsTable";
import { getLastMigration } from "utils/getLastMigration";

export type Query = {
  timestamp: string;
  query: string;
  fileName: string;
};

export async function runMigrations(
  databaseQueryRunner: database.DatabaseQueryRunner,
  sqlMigrationsFolder: string,
): Promise<void> {
  try {
    const migrationsFiles = await fs.promises.readdir(sqlMigrationsFolder);

    const filteredMigrationFiles = migrationsFiles
      .filter((file) => path.extname(file).toLowerCase() === ".sql")
      .sort((a, b) => (a < b ? -1 : 1));

    const queries: Query[] = [];

    for await (const fileName of filteredMigrationFiles) {
      await fs.promises
        .readFile(sqlMigrationsFolder + "/" + fileName, "utf8")
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

    const lastRanMigration = await getLastMigration(databaseQueryRunner);

    console.log(lastRanMigration);

    //   const pendingMigrations = getPendingMigrations(
    //     queries,
    //     lastRanMigration.version,
    //   );

    //   for await (const { timestamp, fileName, query } of pendingMigrations) {
    //     await databaseQueryRunner.transaction(async (client) => {
    //       try {
    //         console.log(`\nRunning ${query}`);
    //         await client.query(query);

    //         console.log("Updating schema_migrations table");
    //         await client.query(
    //           `UPDATE schema_migrations SET version = $1, file_name = $2, query = $3 WHERE id = $4`,
    //           [
    //             timestamp,
    //             fileName,
    //             Buffer.from(query).toString("base64"),
    //             lastRanMigration.id,
    //           ],
    //         );

    //         console.log("Done.");
    //       } catch (error) {
    //         client.query("ROLLBACK");
    //         throw new Error(error);
    //       }
    //     });
    //   }
  } catch (error) {
    console.error(error);
  }

  databaseQueryRunner.close();
}
