import * as database from "@fewlines/fwl-database";
import * as fs from "fs";
import * as path from "path";
import { getPendingMigrations } from "utils/getPendingMigrations";
import { handleSchemaMigrations } from "utils/handleSchemaMigrations";
import { createTimestamp } from "utils/createTimestamp";

export type Query = {
  timestamp: string;
  query: string;
  fileName: string;
};

export async function createMigrationFile(
  args: string[],
  targetDir: string,
): Promise<void> {
  if (process.argv.length === 3) {
    const [arg] = args.slice(2);
    // const targetDir = path.join(process.cwd(), "/sql/migrations");
    const fileName = `${createTimestamp(new Date())}-${arg}.sql`;

    fs.open(`${targetDir + "/" + fileName}`, "wx", (err) => {
      if (err) throw err;

      console.log(`${fileName} has been created in ${targetDir}`);
    });
  } else {
    console.log(
      "❗Please provide a file name like this:\n'yarn db:create-migration-file <file-name>'",
    );
  }
}

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

    const { rows } = await handleSchemaMigrations(databaseQueryRunner);

    const lastRanMigration = rows[rows.length - 1];

    const pendingMigrations = getPendingMigrations(
      queries,
      lastRanMigration.version,
    );

    for await (const { timestamp, fileName, query } of pendingMigrations) {
      await databaseQueryRunner.transaction(async (client) => {
        try {
          console.log(`\nRunning ${query}`);
          await client.query(query);

          console.log("Updating schema_migrations table");
          await client.query(
            `UPDATE schema_migrations SET version = $1, file_name = $2, query = $3 WHERE id = $4`,
            [
              timestamp,
              fileName,
              Buffer.from(query).toString("base64"),
              lastRanMigration.id,
            ],
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
