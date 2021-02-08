import { Attributes } from "@opentelemetry/api";

type TracingConfig = {
  simpleCollector?: {
    serviceName: string;
    url: string;
  };
  lightstepPublicSatelliteCollector?: {
    serviceName: string;
    accessToken: string;
    url?: string;
  };
  attributes?: Attributes;
};

const defaultConfig = (serviceName: string): TracingConfig => {
  return {
    simpleCollector: {
      serviceName,
      url: "http://localhost:9411/api/v2/spans",
    },
  };
};

export { defaultConfig, TracingConfig };
