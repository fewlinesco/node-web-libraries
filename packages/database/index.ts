/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool, QueryArrayResult, PoolClient } from "pg";

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

type TransactionFunction = (client: PoolClient) => Promise<any>;

export interface DatabaseQueryRunner {
  query: (query: string, values?: any[]) => Promise<QueryArrayResult<any>>;
  close: () => Promise<void>;
  transaction: (txFunc: TransactionFunction) => Promise<any>;
}

export class TransactionError extends Error {
  public PGError: Error;
  constructor(error: Error) {
    super(error.message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.PGError = error;
    this.name = "TransactionFailed";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransactionError);
    }
  }
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
    transaction: async (transactionFunction): Promise<any> => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await transactionFunction(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw new TransactionError(error);
      } finally {
        client.release();
      }
    },
  };
}
