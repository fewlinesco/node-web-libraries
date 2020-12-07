import { JWTPayload, SupportedAlgo } from "@src/types";
import jwt from "jsonwebtoken";

import { asymmetricAlgoKeyPair, defaultPayload, defaultSecret } from ".";

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
