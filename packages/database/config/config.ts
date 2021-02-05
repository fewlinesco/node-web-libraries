import { ConnectionOptions } from "tls";

interface DatabaseConfig {
  database: string;
  host: string;
  password: string;
  port: number;
  username: string;
  ssl?: boolean | ConnectionOptions;
}

interface DatabaseConfigWithDatabaseUrl {
  url: string;
  ssl?: Record<string, unknown>;
}

const defaultConfig: DatabaseConfig = {
  host: "localhost",
  password: "",
  username: "",
  database: "",
  port: 5432,
};

export { DatabaseConfig, DatabaseConfigWithDatabaseUrl, defaultConfig };
