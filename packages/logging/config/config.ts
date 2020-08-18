export interface LoggerConfig {
  encoder: EncoderTypeEnum;
  service: string;
}

export enum EncoderTypeEnum {
  JSON = "json",
  KV = "KV",
}

export const defaultConfig = (service: string): LoggerConfig => {
  return { service, encoder: EncoderTypeEnum.JSON };
};
