import * as database from "@fewlines/fwl-database";
import { v4 as uuidv4 } from "uuid";

export function handleSchemaMigrations(
  databaseQueryRunner: database.DatabaseQueryRunner,
): Promise<any> {
  return databaseQueryRunner.transaction(async (client) => {
    const query = `
      CREATE TABLE IF NOT EXISTS "schema_migrations" (
        "id" uuid NOT NULL,
        "version" varchar(14) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "query" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "updated_at" timestamp NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("id")
      );`;

    // Remove insert when create the table.

    const timestamp = "00000000000000";

    const fileName = `${timestamp}-create-migration_schemas`;

    await client.query(query);

    const schemaMigrations = await client.query(
      "SELECT * FROM schema_migrations",
    );

    if (schemaMigrations.rows.length === 0) {
      return await client.query(
        "INSERT INTO schema_migrations (id, version, file_name, query) VALUES ($1, $2, $3, $4) RETURNING *",
        [uuidv4(), timestamp, fileName, query],
      );
    } else {
      return schemaMigrations;
    }
  });
}
