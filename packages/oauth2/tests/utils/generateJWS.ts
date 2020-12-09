import type { CustomPayload } from "@src/types";
import {
  defaultAsymmetricAlgoKeyPair,
  defaultPayload,
  defaultSecret,
} from "@tests/utils";
import jwt from "jsonwebtoken";

export function generateHS256JWS(
  customPayload?: CustomPayload,
  secret?: string,
): string {
  const composedJWTPayload = {
    ...defaultPayload,
    ...customPayload,
  };

  return jwt.sign(composedJWTPayload, secret ? secret : defaultSecret, {
    algorithm: "HS256",
  });
}

export function generateRS256JWS(
  customPayload?: CustomPayload,
  privateKey?: string,
): string {
  const composedJWTPayload = {
    ...defaultPayload,
    ...customPayload,
  };
  return jwt.sign(
    composedJWTPayload,
    privateKey ? privateKey : defaultAsymmetricAlgoKeyPair.privateKey,
    {
      algorithm: "RS256",
    },
  );
}
