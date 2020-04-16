export interface Config {
  database: {
    database: string;
    host: string;
    password: string;
    username: string;
    port: number;
  };
  http: {
    port: number;
  };
  tracing: {
    serviceName: string;
    url?: string;
  };
}

export const configDefaults = {
  database: {
    host: "localhost",
    password: "",
    username: "",
    database: "",
    port: 5432,
  },
};
