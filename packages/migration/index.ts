import * as database from "@fewlines/fwl-database";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

type Query = {
  timestamp: string;
  query: string;
  fileName: string;
};

function handleSchemaMigrations(
  databaseQueryRunner: database.DatabaseQueryRunner,
  queries: Query[],
): Promise<any> {
  return databaseQueryRunner.transaction(async (client) => {
    const { timestamp, fileName, query } = queries[0];

    // Create `schema_migrations` table if not exists.
    await client.query(query);

    const schemaMigrations = await client.query(
      "SELECT * FROM schema_migrations",
    );

    if (schemaMigrations.rows.length === 0) {
      return await client.query(
        "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4) RETURNING *",
        [uuidv4(), timestamp, fileName, Buffer.from(query).toString("base64")],
      );
    } else {
      return schemaMigrations;
    }
  });
}

function getPendingMigrations(queries: Query[], timestamp: string): Query[] {
  const index = queries.findIndex((query) =>
    query.timestamp.includes(timestamp),
  );

  return queries.slice(index + 1);
}

// Format Date in to 14 char timestamp (i.e. `2020-05-07T09:59:22.603Z` => `20200507095922`).
function createTimestamp(date: Date): string | void {
  const filteredDate = date.toISOString().match(/[\d]/g);

  if (filteredDate) {
    return filteredDate.join("").slice(0, -3);
  } else {
    throw new Error("❗Incorrect date format. Please use `new Date()`");
  }
}

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

    const { rows } = await handleSchemaMigrations(databaseQueryRunner, queries);

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
