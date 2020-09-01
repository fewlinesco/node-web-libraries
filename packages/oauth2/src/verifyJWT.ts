import jwt from "jsonwebtoken";

import {
  InvalidAudience,
  MissingClientSecret,
  InvalidKeyIDRS256,
  MissingJWKSURI,
  MissingKeyIDHS256,
  AlgoNotSupported,
} from "./errors";
import { JWKSDT } from "./types";
import { decodeJWTPart } from "./utils/decodeJWTPart";
import { rsaPublicKeyToPEM } from "./utils/rsaPublicKeyToPEM";

type VerifyJWTProps = {
  accessToken: string;
  audience: string | string[];
  clientSecret?: string;
  jwksURI?: string;
};

export async function verifyJWT<T>({
  accessToken,
  audience,
  clientSecret,
  jwksURI,
}: VerifyJWTProps): Promise<T> {
  const JWKS: JWKSDT =
    jwksURI && (await fetch(jwksURI).then((response) => response.json()));

  return new Promise((resolve, reject) => {
    const [header, payload] = accessToken.split(".");

    const { alg, kid } = decodeJWTPart<{ alg: string; kid: string }>(header);
    const { aud } = decodeJWTPart(payload);

    if (
      (typeof aud === "string" && aud !== audience) ||
      (Array.isArray(aud) && !aud.includes(audience))
    ) {
      reject(new InvalidAudience("Invalid audience"));
    }

    if (alg === "HS256") {
      if (clientSecret) {
        jwt.verify(
          accessToken,
          clientSecret,
          {
            algorithms: ["HS256"],
          },
          (error: jwt.VerifyErrors | null, decoded: unknown) => {
            return error ? reject(error) : resolve(decoded as T);
          },
        );
      } else {
        reject(
          new MissingClientSecret(
            "Missing Client Secret for HS256 encoded JWT",
          ),
        );
      }
    } else if (alg === "RS256") {
      if (kid) {
        if (JWKS) {
          const validKey = JWKS.keys.find((keyObject) => keyObject.kid === kid);

          if (validKey) {
            const { e, n } = validKey;
            const publicKey = rsaPublicKeyToPEM(n, e);

            return jwt.verify(
              accessToken,
              publicKey,
              {
                algorithms: ["RS256"],
              },
              (error: jwt.VerifyErrors | null, decoded: unknown) => {
                return error ? reject(error) : resolve(decoded as T);
              },
            );
          } else {
            reject(
              new InvalidKeyIDRS256(
                "Invalid key ID (kid) for RS256 encoded JWT",
              ),
            );
          }
        } else {
          reject(new MissingJWKSURI("Missing JWKS URI for RS256 encoded JWT"));
        }
      } else {
        reject(
          new MissingKeyIDHS256("Missing key ID (kid) for RS256 encoded JWT"),
        );
      }
    } else {
      reject(new AlgoNotSupported("Encoding algo not supported"));
    }
  });
}
