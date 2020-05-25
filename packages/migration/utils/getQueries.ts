import * as fs from "fs";
import * as path from "path";

import { Query } from "../index";

export async function getQueries(
  sqlMigrationsFolder: string,
): Promise<Query[]> {
  const migrationsDirPath = path.join(process.cwd(), sqlMigrationsFolder);

  const migrationsFiles = await fs.promises.readdir(migrationsDirPath);

  const filteredMigrationFiles = migrationsFiles
    .filter((file) => path.extname(file).toLowerCase() === ".sql")
    .sort();

  const queries: Query[] = [];

  for await (const fileName of filteredMigrationFiles) {
    await fs.promises
      .readFile(`${migrationsDirPath}/${fileName}`, "utf8")
      .then((query) => {
        const timestamp = fileName.split("-")[0];

        queries.push({
          timestamp,
          fileName,
          query,
        });
      });
  }

  return queries;
}
