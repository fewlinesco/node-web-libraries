interface LoggerConfig {
  encoder: EncoderTypeEnum;
  service: string;
}

enum EncoderTypeEnum {
  JSON = "json",
  KV = "KV",
}

const defaultConfig = (service: string): LoggerConfig => {
  return { service, encoder: EncoderTypeEnum.JSON };
};

export { defaultConfig, EncoderTypeEnum, LoggerConfig };
