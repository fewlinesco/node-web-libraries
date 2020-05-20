import { Query } from "index";

export function getPendingMigrations(
  queries: Query[],
  timestamp: string,
): Query[] {
  const index = queries.findIndex((query) =>
    query.timestamp.includes(timestamp),
  );
  return queries.slice(index + 1);
}
