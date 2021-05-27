import { SpanAttributes } from "@opentelemetry/api";

type TracingConfig = {
  collectors?: {
    type: "otel";
    serviceName: string;
    authorizationHeader?: {
      key: string;
      value: string;
    };
    url: string;
  }[];
  simpleCollector?: {
    serviceName: string;
    url: string;
  };
  lightstepPublicSatelliteCollector?: {
    serviceName: string;
    accessToken: string;
    url?: string;
  };
  attributes?: SpanAttributes;
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
