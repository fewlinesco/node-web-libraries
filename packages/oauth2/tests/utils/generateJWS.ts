import type { JWTPayload, SupportedAlgo } from "@src/types";
import {
  asymmetricAlgoKeyPair,
  defaultPayload,
  defaultSecret,
} from "@tests/utils";
import jwt from "jsonwebtoken";

export function generateJWS(
  algorithm: SupportedAlgo,
  customPayload?: Partial<JWTPayload>,
  secretOrPrivateKey = algorithm === "RS256"
    ? asymmetricAlgoKeyPair.privateKey
    : defaultSecret,
): string {
  const JWSPayload = {
    ...defaultPayload,
    ...customPayload,
  };

  return jwt.sign(JWSPayload, secretOrPrivateKey, {
    algorithm,
  });
}
