import logfmt from "logfmt";

import { LoggerConfig, EncoderTypeEnum } from "./config/config";

interface Logger {
  log: (message: string, metadata?: Metadata) => void;
  withMeta: (metadata: Metadata) => Logger;
}

type Metadata = Record<string, string | number>;

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

function createLogger(config: LoggerConfig): Logger {
  if (config.encoder === EncoderTypeEnum.KV) {
    return new KVLogger(config.service);
  } else if (config.encoder === EncoderTypeEnum.JSON) {
    return new JSONLogger(config.service);
  }
}

export type { Metadata };
export { createLogger, Logger };
