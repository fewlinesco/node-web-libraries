import { DatabaseConfig, DatabaseConfigWithDatabaseUrl } from "@fwl/database";

interface MigrateConfig {
  dirPath: string;
  tableName?: string;
}

interface RunMigrationsConfig {
  database: DatabaseConfig | DatabaseConfigWithDatabaseUrl;
  migration: MigrateConfig;
}

const defaultMigrateConfig = {
  dirPath: "./migrations",
};

const defaultDatabaseConfig = {
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "postgres",
};

const defaultMigrationConfig = {
  database: defaultDatabaseConfig,
  migration: defaultMigrateConfig,
};

export {
  defaultDatabaseConfig,
  defaultMigrateConfig,
  defaultMigrationConfig,
  MigrateConfig,
  RunMigrationsConfig,
};
