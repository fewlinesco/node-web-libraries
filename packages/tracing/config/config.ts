export interface TracingConfig {
  serviceName: string;
  url?: string;
}

export const defaultConfig = {
  url: "http://localhost:14268/api/traces",
};
