import { AlgoNotSupported } from "@src/errors";
import { CustomGenerateJWSOptions, SupportedAlgo } from "@src/types";
import {
  defaultAsymmetricAlgoKeyPair,
  defaultPayload,
  defaultSecret,
} from "@tests/utils";
import jwt from "jsonwebtoken";

export function generateDefaultHS256JWS(): string {
  return jwt.sign(defaultPayload, defaultSecret, {
    algorithm: SupportedAlgo.HS256,
  });
}

export function generateDefaultRS256JWS(): string {
  return jwt.sign(defaultPayload, defaultAsymmetricAlgoKeyPair.privateKey, {
    algorithm: SupportedAlgo.RS256,
  });
}

export function generateCustomJWS(
  algorithm: SupportedAlgo,
  customOption: CustomGenerateJWSOptions,
): string {
  const { customPayload, secretOrPrivateKey } = customOption;

  const JWSPayload = {
    ...defaultPayload,
    ...customPayload,
  };

  switch (algorithm) {
    case "HS256":
      return jwt.sign(
        JWSPayload,
        secretOrPrivateKey ? secretOrPrivateKey : defaultSecret,
        {
          algorithm,
        },
      );
    case "RS256":
      return jwt.sign(
        JWSPayload,
        secretOrPrivateKey
          ? secretOrPrivateKey
          : defaultAsymmetricAlgoKeyPair.privateKey,
        {
          algorithm,
        },
      );
    default:
      throw new AlgoNotSupported();
  }
}
