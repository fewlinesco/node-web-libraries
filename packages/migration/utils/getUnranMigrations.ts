import { Query } from "index";

export type SchemaMigrationsRow = {
  id: string;
  version: string;
  file_name: string;
  query: string;
  created_at: string;
};

export function getUnranMigrations(
  rows: SchemaMigrationsRow[],
  queries: Query[],
): Query[] {
  const ranMigrationsVersions = rows.map((row) => row.version);

  return queries
    .map((query) => {
      if (!ranMigrationsVersions.includes(query.timestamp)) {
        return query;
      }
    })
    .filter((query) => query !== undefined);
}
