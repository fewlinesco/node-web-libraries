/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool, QueryArrayResult } from "pg";

interface PGOptions {
  database: string;
  host: string;
  password: string;
  port: number;
  username: string;
}

function close(pool: Pool): Promise<void> {
  return pool.end();
}

export interface DatabaseQueryRunner {
  query: (query: string, values?: any[]) => Promise<QueryArrayResult<any>>;
  close: () => Promise<void>;
}

export function connect(options: PGOptions): DatabaseQueryRunner {
  const pool = new Pool({
    user: options.username,
    password: options.password,
    host: options.host,
    database: options.database,
    port: options.port,
  });
  return {
    close: (): Promise<void> => close(pool),
    query: (query, values = []): Promise<QueryArrayResult<any>> =>
      pool.query(query, values),
  };
}
