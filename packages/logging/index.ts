import logfmt from "logfmt";

export interface Logger {
  log: (message: string, metadata?: object) => void;
  withMeta: (metadata: object) => Logger;
}

class KVLogger implements Logger {
  private service: string;
  private metadata: object;
  constructor(service: string, metadata: object = {}) {
    this.service = service;
    this.metadata = { ...metadata, service };
  }

  log(message: string, metadata: object = {}): void {
    logfmt.log({ ...this.metadata, ...metadata, message });
  }
  withMeta(metadata: object): KVLogger {
    return new KVLogger(this.service, { ...this.metadata, ...metadata });
  }
}

class JSONLogger implements Logger {
  private logger;
  private service: string;
  private metadata: object;
  constructor(service: string, metadata: object = {}) {
    this.logger = new logfmt();
    this.logger.stringify = JSON.stringify;
    this.service = service;
    this.metadata = { ...metadata, service };
  }

  log(message: string, metadata: object = {}): void {
    this.logger.log({ ...this.metadata, ...metadata, message });
  }
  withMeta(metadata: object): JSONLogger {
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
