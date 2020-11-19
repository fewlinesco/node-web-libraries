import { DatabaseConfig } from "@fwl/database";

export interface MigrateConfig {
  dirPath: string;
}

export interface RunMigrationsConfig {
  database: DatabaseConfig;
  migration: MigrateConfig;
}

export const defaultMigrateConfig = {
  dirPath: "./migrations",
};

export const defaultDatabaseConfig = {
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "postgres"
}

export const defaultMigrationConfig = {
  database: defaultDatabaseConfig,
  migration: defaultMigrateConfig
}