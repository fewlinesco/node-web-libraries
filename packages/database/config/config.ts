interface DatabaseConfig {
  database: string;
  host: string;
  password: string;
  port: number;
  username: string;
  ssl?: boolean;
}

interface DatabaseConfigWithDatabaseUrl {
  url: string;
  ssl?: boolean;
}

const defaultConfig: DatabaseConfig = {
  host: "localhost",
  password: "",
  username: "",
  database: "",
  port: 5432,
  ssl: false,
};

export { DatabaseConfig, DatabaseConfigWithDatabaseUrl, defaultConfig };
