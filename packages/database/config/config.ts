export interface DatabaseConfig {
  database: string;
  host: string;
  password: string;
  port: number;
  username: string;
}

export const defaultConfig: DatabaseConfig = {
  host: "localhost",
  password: "",
  username: "",
  database: "",
  port: 5432,
};
