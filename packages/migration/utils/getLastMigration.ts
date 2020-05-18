import * as database from "@fewlines/fwl-database";
import { QueryResult } from "pg";

export type SchemaMigrationsRow = {
  id: string;
  version: string;
  file_name: string;
  query: string;
  created_at: string;
};

export function getLastMigration(
  databaseQueryRunner: database.DatabaseQueryRunner,
): Promise<QueryResult<SchemaMigrationsRow>> {
  return databaseQueryRunner.query(
    "SELECT * FROM schema_migrations ORDER BY created_at DESC LIMIT 1",
  );
}
