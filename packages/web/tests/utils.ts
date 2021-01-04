import { Logger } from "@fwl/logging";

type Metadata = Record<string, string | number>;
type Log = Metadata & { message: string };
export class InMemoryLogger implements Logger {
  private logs: Log[];
  private metadata?: Metadata;

  constructor(metadata?: Metadata) {
    this.metadata = metadata;
    this.logs = [];
  }

  log(message: string, metadata?: Metadata): this {
    const log = { ...metadata, message };
    this.logs.push(log);
    return this;
  }

  withMeta(metadata: Metadata): InMemoryLogger {
    return new InMemoryLogger(metadata);
  }

  getLog(index: number): Log {
    return this.logs[index];
  }
}
