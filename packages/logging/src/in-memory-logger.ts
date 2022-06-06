import { Logger, Metadata } from "./logger";

type Log = Metadata & { message: string };

class InMemoryLogger implements Logger {
  private logs: Log[];
  private metadata: Metadata;

  constructor(metadata: Metadata = {}) {
    this.metadata = metadata;
    this.logs = [];
  }

  log(message: string, metadata: Metadata = {}): this {
    const log = { ...this.metadata, ...metadata, message };
    this.logs.push(log);
    return this;
  }

  withMeta(metadata: Metadata): InMemoryLogger {
    return new InMemoryLogger({ ...this.metadata, ...metadata });
  }

  getLog(index: number): Log {
    return this.logs[index];
  }
}

export { InMemoryLogger };
