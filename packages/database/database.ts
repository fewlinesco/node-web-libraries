/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tracer, Span } from "@fwl/tracing";
import { Pool, QueryArrayResult, PoolClient } from "pg";

import { DatabaseConfig, defaultConfig } from "./config/config";

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

export class DuplicateEntryError extends Error {
  public PGError: Error;
  constructor(error: Error) {
    super(error.message);
    this.PGError = error;
    this.name = "DuplicateEntry";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DuplicateEntryError);
    }
  }
}

export class BadUUIDError extends Error {
  public PGError: Error;
  constructor(error: Error) {
    super(error.message);
    this.PGError = error;
    this.name = "BadUUID";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BadUUIDError);
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
    query: async (query, values = []): Promise<QueryArrayResult<any>> => {
      try {
        if (txClient) {
          return await txClient.query(query, values);
        } else {
          return await pool.query(query, values);
        }
      } catch (error) {
        checkDatabaseError(error);
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

function checkDatabaseError(error: any): void {
  console.log(error.message);
  if (
    error.code === "23505" &&
    (error.message as string).includes(
      "duplicate key value violates unique constraint",
    )
  ) {
    throw new DuplicateEntryError(error);
  } else if (
    error.code === "22P02" // &&
    // (error.message as string).includes("invalid input syntax for type uuid")
  ) {
    console.log("should throw a baduuid");
    throw new BadUUIDError(error);
  } else {
    throw error;
  }
}

export function connect(
  tracer: Tracer,
  options?: DatabaseConfig,
): DatabaseQueryRunner {
  const config = options ? options : defaultConfig;
  const pool = new Pool({
    user: config.username,
    password: config.password,
    host: config.host,
    database: config.database,
    port: config.port,
  });
  return queryRunner(pool, tracer);
}

export function connectWithoutTracing(
  config: DatabaseConfig,
): DatabaseQueryRunnerWithoutTracing {
  const pool = new Pool({
    user: config.username,
    password: config.password,
    host: config.host,
    database: config.database,
    port: config.port,
  });
  return queryRunnerWithoutTracing(pool);
}
