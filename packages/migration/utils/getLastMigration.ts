import * as database from "@fewlines/fwl-database";

export type SchemaMigrationsRow = {
  id: string;
  version: string;
  file_name: string;
  query: string;
  created_at: string;
};

export async function getLastMigration(
  databaseQueryRunner: database.DatabaseQueryRunner,
): Promise<SchemaMigrationsRow> {
  const { rows } = await databaseQueryRunner.query(
    "SELECT * FROM schema_migrations ORDER BY created_at DESC LIMIT 1",
  );

  return rows[0];
}
