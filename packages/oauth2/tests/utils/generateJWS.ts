import { AsymmetricAlgoKeyPair, JWTPayload, SupportedAlgo } from "@src/types";
import jwt from "jsonwebtoken";

import { asymmetricAlgoKeyPair, defaultPayload } from ".";

export function generateJWS(
  customPayload: Partial<JWTPayload>,
  customAsymmetricAlgoKeyPair: AsymmetricAlgoKeyPair,
  algorithm: SupportedAlgo,
): string {
  const JWSPayload = {
    ...defaultPayload,
    ...customPayload,
  };

  const asyncKeyPair = {
    ...asymmetricAlgoKeyPair,
    ...customAsymmetricAlgoKeyPair,
  };

  const { privateKey } = asyncKeyPair;

  return jwt.sign(JWSPayload, privateKey, {
    algorithm,
  });
}
