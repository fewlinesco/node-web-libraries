import { ConnectionOptions } from "tls";

type DatabaseConfig = DatabaseConfigWithObject | DatabaseConfigWithDatabaseUrl;

type DatabaseConfigWithObject = {
  database: string;
  host: string;
  password: string;
  port: number;
  username: string;
  ssl?: boolean | ConnectionOptions;
};

const defaultConfig: DatabaseConfigWithObject = {
  host: "localhost",
  password: "",
  username: "",
  database: "",
  port: 5432,
};

type DatabaseConfigWithDatabaseUrl = {
  url: string;
  ssl?: boolean | ConnectionOptions;
};

export { DatabaseConfig, DatabaseConfigWithObject, defaultConfig };
