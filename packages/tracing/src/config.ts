import { Attributes } from "@opentelemetry/api";

export type TracingConfig = {
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

export const defaultConfig = (serviceName: string): TracingConfig => {
  return {
    simpleCollector: {
      serviceName,
      url: "http://localhost:9411/api/v2/spans",
    },
  };
};
