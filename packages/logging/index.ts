import logfmt from "logfmt";

export interface Logger {
  log: (message: string, metadata?: Metadata) => void;
  withMeta: (metadata: Metadata) => Logger;
}

export type Metadata = Record<string, string | number>;

class KVLogger implements Logger {
  private service: string;
  private metadata: Metadata;
  constructor(service: string, metadata: Metadata = {}) {
    this.service = service;
    this.metadata = { ...metadata, service };
  }

  log(message: string, metadata: Metadata = {}): void {
    logfmt.log({ ...this.metadata, ...metadata, message });
  }
  withMeta(metadata: Metadata): KVLogger {
    return new KVLogger(this.service, { ...this.metadata, ...metadata });
  }
}

class JSONLogger implements Logger {
  private logger;
  private service: string;
  private metadata: Metadata;
  constructor(service: string, metadata: Metadata = {}) {
    this.logger = new logfmt();
    this.logger.stringify = JSON.stringify;
    this.service = service;
    this.metadata = { ...metadata, service };
  }

  log(message: string, metadata: Metadata = {}): void {
    this.logger.log({ ...this.metadata, ...metadata, message });
  }
  withMeta(metadata: Metadata): JSONLogger {
    return new JSONLogger(this.service, { ...this.metadata, ...metadata });
  }
}

export function createLogger(
  service: string,
  format: "KV" | "json" = "KV",
): Logger {
  if (format === "KV") {
    return new KVLogger(service);
  } else if (format === "json") {
    return new JSONLogger(service);
  }
}
