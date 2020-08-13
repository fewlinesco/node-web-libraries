import * as database from "@fwl/database";

export async function createSchemaMigrationsTable(
  databaseQueryRunner: database.DatabaseQueryRunner,
): Promise<void> {
  await databaseQueryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schema_migrations" (
        "id" uuid NOT NULL,
        "version" varchar(14) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "query" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("id")
      );`);
}
