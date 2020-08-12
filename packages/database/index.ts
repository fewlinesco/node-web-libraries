/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tracer, Span } from "@fwl/tracing";
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

type TransactionFunction = (
  client: DatabaseQueryRunner | DatabaseQueryRunnerWithoutTracing,
) => Promise<any>;

interface DatabaseBaseQueryRunner {
  query: (query: string, values?: any[]) => Promise<QueryArrayResult<any>>;
  close: () => Promise<void>;
  transaction: (txFunc: TransactionFunction) => Promise<any>;
}

export interface DatabaseQueryRunner extends DatabaseBaseQueryRunner {
  _type?: "DatabaseQueryRunner";
}

export interface DatabaseQueryRunnerWithoutTracing
  extends DatabaseBaseQueryRunner {
  _type?: "DatabaseQueryRunnerWithoutTracing";
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

function queryRunner(
  pool: Pool,
  tracer: Tracer,
  txClient: undefined | PoolClient = undefined,
): DatabaseQueryRunner {
  const withoutTracing = queryRunnerWithoutTracing(pool, txClient);
  return {
    close: async (): Promise<void> => {
      return tracer.span("db-close", async () => {
        return withoutTracing.close();
      });
    },
    query: (query, values = []): Promise<QueryArrayResult<any>> => {
      return tracer.span("db-query", async (span: Span) => {
        span.setAttribute("db.statement", query);
        return withoutTracing.query(query, values);
      });
    },
    transaction: async (transactionFunction): Promise<any> => {
      return tracer.span("db-transaction", async () => {
        if (txClient) {
          throw new TransactionError(
            new Error("Can't run a transaction inside another transaction"),
          );
        }
        const newTxClient: PoolClient = await pool.connect();
        try {
          await newTxClient.query("BEGIN");
          const result = await transactionFunction(
            queryRunner(pool, tracer, newTxClient),
          );
          await newTxClient.query("COMMIT");
          return result;
        } catch (error) {
          await newTxClient.query("ROLLBACK");
          throw new TransactionError(error);
        } finally {
          newTxClient.release();
        }
      });
    },
  };
}

function queryRunnerWithoutTracing(
  pool: Pool,
  txClient: undefined | PoolClient = undefined,
): DatabaseQueryRunnerWithoutTracing {
  return {
    close: async (): Promise<void> => {
      if (txClient) {
        throw new TransactionError(
          new Error("Can't close a connection inside a transaction"),
        );
      } else {
        close(pool);
      }
    },
    query: (query, values = []): Promise<QueryArrayResult<any>> => {
      if (txClient) {
        return txClient.query(query, values);
      } else {
        return pool.query(query, values);
      }
    },
    transaction: async (transactionFunction): Promise<any> => {
      if (txClient) {
        throw new TransactionError(
          new Error("Can't run a transaction inside another transaction"),
        );
      }
      const newTxClient: PoolClient = await pool.connect();
      try {
        await newTxClient.query("BEGIN");
        const result = await transactionFunction(
          queryRunnerWithoutTracing(pool, newTxClient),
        );
        await newTxClient.query("COMMIT");
        return result;
      } catch (error) {
        await newTxClient.query("ROLLBACK");
        throw new TransactionError(error);
      } finally {
        newTxClient.release();
      }
    },
  };
}

export function connect(
  options: PGOptions,
  tracer: Tracer,
): DatabaseQueryRunner {
  const pool = new Pool({
    user: options.username,
    password: options.password,
    host: options.host,
    database: options.database,
    port: options.port,
  });
  return queryRunner(pool, tracer);
}

export function connectWithoutTracing(
  options: PGOptions,
): DatabaseQueryRunnerWithoutTracing {
  const pool = new Pool({
    user: options.username,
    password: options.password,
    host: options.host,
    database: options.database,
    port: options.port,
  });
  return queryRunnerWithoutTracing(pool);
}
