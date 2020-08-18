export interface TracingConfig {
  serviceName: string;
  url: string;
}

export const defaultConfig = (serviceName: string): TracingConfig => {
  return { serviceName, url: "http://localhost:14268/api/traces" };
};
