/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tracer, Span } from "@fwl/tracing";
import { Pool, QueryArrayResult, PoolClient } from "pg";

import {
  DatabaseConfig,
  DatabaseConfigWithObject,
  defaultConfig,
} from "./config/config";

function close(pool: Pool): Promise<void> {
  console.log("✅");
  return pool.end();
}

type TransactionFunction = (
  client:
    | DatabaseQueryRunner
    | DatabaseQueryRunnerWithoutTracing
    | DatabaseQueryRunnerSandbox,
) => Promise<any>;

interface DatabaseBaseQueryRunner {
  query: (query: string, values?: any[]) => Promise<QueryArrayResult<any>>;
  close: () => Promise<void>;
  transaction: (txFunc: TransactionFunction) => Promise<any>;
}

type DatabaseQueryRunner =
  | DatabaseQueryRunnerWithoutTracing
  | DatabaseQueryRunnerSandbox
  | DatabaseQueryRunnerWithTracing;
interface DatabaseQueryRunnerWithTracing extends DatabaseBaseQueryRunner {
  _type?: "DatabaseQueryRunnerWithTracing";
}

interface DatabaseQueryRunnerWithoutTracing extends DatabaseBaseQueryRunner {
  _type?: "DatabaseQueryRunnerWithoutTracing";
}

interface DatabaseQueryRunnerSandbox extends DatabaseBaseQueryRunner {
  _type?: "DatabaseQueryRunnerSandbox";
}

class TransactionError extends Error {
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

class DuplicateEntryError extends Error {
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

class BadUUIDError extends Error {
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
): DatabaseQueryRunnerWithTracing {
  const withoutTracing = queryRunnerWithoutTracing(pool, txClient);
  return {
    close: async (): Promise<void> => {
      return tracer.span("db-close", async () => {
        return withoutTracing.close();
      });
    },
    query: (query, values = []): Promise<QueryArrayResult<any>> => {
      return tracer.span("db-query", async (span: Span) => {
        span.setDisclosedAttribute("db.statement", query);
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

function queryRunnerSandbox(
  pool: Pool,
  txClient: PoolClient,
  insideTransaction = false,
): DatabaseQueryRunnerSandbox {
  return {
    close: async (): Promise<void> => {
      try {
        await txClient.query("ROLLBACK");
        txClient.release();
        close(pool);
      } catch (error) {
        return close(pool);
      }
    },
    query: async (query, values = []): Promise<QueryArrayResult<any>> => {
      try {
        if (query.toUpperCase() === "ROLLBACK") {
          return await txClient.query(
            "ROLLBACK TO SAVEPOINT fwl_database_sandbox_savepoint;",
          );
        } else {
          await txClient.query("SAVEPOINT fwl_database_sandbox_savepoint;");
          return await txClient.query(query, values);
        }
      } catch (error) {
        console.log("🔴", error);
        checkDatabaseError(error);
      }
    },
    transaction: async (transactionFunction): Promise<any> => {
      if (insideTransaction) {
        throw new TransactionError(
          new Error("Can't run a transaction inside another transaction"),
        );
      }
      try {
        await txClient.query("SAVEPOINT fwl_database_sandbox_savepoint_;");
        return transactionFunction(queryRunnerSandbox(pool, txClient, true));
      } catch (error) {
        await txClient.query(
          "ROLLBACK TO SAVEPOINT fwl_database_sandbox_savepoint;",
        );
        throw new TransactionError(error);
      } finally {
        await txClient.query(
          "RELEASE SAVEPOINT fwl_database_sandbox_savepoint;",
        );
      }
    },
  };
}

function checkDatabaseError(error: any): void {
  if (
    error.code === "23505" &&
    (error.message as string).includes(
      "duplicate key value violates unique constraint",
    )
  ) {
    throw new DuplicateEntryError(error);
  } else if (
    error.code === "22P02" &&
    // Postgres 9 and 10 have a slightly different error messages so we test the two
    ((error.message as string).includes("invalid input syntax for type uuid") ||
      (error.message as string).includes("invalid input syntax for uuid"))
  ) {
    throw new BadUUIDError(error);
  } else {
    throw error;
  }
}

function connect(
  tracer: Tracer,
  options?: DatabaseConfig,
): DatabaseQueryRunner {
  const config = getConfig(options);

  const pool = new Pool({
    user: config.username,
    password: config.password,
    host: config.host,
    database: config.database,
    port: config.port,
    ssl: config.ssl,
  });
  return queryRunner(pool, tracer);
}

function connectWithoutTracing(
  options?: DatabaseConfig,
): DatabaseQueryRunnerWithoutTracing {
  const config = getConfig(options);

  const pool = new Pool({
    user: config.username,
    password: config.password,
    host: config.host,
    database: config.database,
    port: config.port,
    ssl: config.ssl,
  });
  return queryRunnerWithoutTracing(pool);
}

async function connectInSandbox(
  options?: DatabaseConfig,
): Promise<DatabaseQueryRunnerSandbox> {
  const config = getConfig(options);

  const pool = new Pool({
    user: config.username,
    password: config.password,
    host: config.host,
    database: config.database,
    port: config.port,
    ssl: config.ssl,
  });
  const client: PoolClient = await pool.connect();
  await client.query("BEGIN");
  return queryRunnerSandbox(pool, client);
}

function convertUrl(databaseUrl: string): DatabaseConfigWithObject {
  const { hostname, port, password, username, pathname } = new URL(databaseUrl);
  return {
    host: hostname,
    username,
    password,
    port: parseInt(port),
    database: pathname.slice(1),
  };
}

function getConfig(options?: DatabaseConfig): DatabaseConfigWithObject {
  if (!options) {
    return defaultConfig;
  }
  let config: DatabaseConfigWithObject;
  if ("url" in options) {
    config = convertUrl(options.url);
  } else {
    config = options;
  }
  if ("ssl" in options) {
    config.ssl = options.ssl;
  }
  return config;
}

export {
  BadUUIDError,
  connect,
  connectInSandbox,
  connectWithoutTracing,
  convertUrl,
  DatabaseQueryRunner,
  DatabaseQueryRunnerSandbox,
  DatabaseQueryRunnerWithoutTracing,
  DatabaseQueryRunnerWithTracing,
  DuplicateEntryError,
  TransactionError,
};
