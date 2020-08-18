export interface TracingConfig {
  serviceName: string;
  url?: string;
}

export const defaultConfig: TracingConfig = {
  serviceName: "default",
};
