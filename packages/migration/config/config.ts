import { DatabaseConfig } from "@fwl/database";

export interface MigrateConfig {
  dirPath: string;
}

export interface RunMigrationsConfig {
  database: DatabaseConfig;
  migration: MigrateConfig;
}

export const defaultConfig = {
  dirPath: "./migrations",
};
