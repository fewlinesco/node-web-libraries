export type TracingConfig = {
  serviceName: string;
  url: string;
};

export const defaultConfig = (serviceName: string): TracingConfig => {
  return {
    serviceName,
    url: "http://localhost:9411/api/v2/spans",
  };
};
