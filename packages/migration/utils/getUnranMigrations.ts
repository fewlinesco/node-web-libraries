import { Query, SchemaMigrationsRow } from "index";

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
