import jwt from "jsonwebtoken";

import { CustomPayload } from "../types";
import {
  defaultAsymmetricAlgoKeyPair,
  defaultPayload,
  defaultSecret,
} from "./defaultObjects";

export function generateHS256JWS(
  customPayload?: CustomPayload,
  secret?: string,
): string {
  return jwt.sign(
    customPayload ? customPayload : defaultPayload,
    secret ? secret : defaultSecret,
    {
      algorithm: "HS256",
    },
  );
}

export function generateRS256JWS(
  customPayload?: CustomPayload,
  privateKey?: string,
): string {
  return jwt.sign(
    customPayload ? customPayload : defaultPayload,
    privateKey ? privateKey : defaultAsymmetricAlgoKeyPair.privateKey,
    {
      algorithm: "RS256",
    },
  );
}
