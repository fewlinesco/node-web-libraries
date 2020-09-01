import jwt from "jsonwebtoken";
import { JWKSDT } from "types";

import { rsaPublicKeyToPEM } from "./rsaPublicKeyToPEM";

function decodeJWTPart<T>(JWTPart: string): T {
  const base64 = JWTPart.replace(/-/g, "+").replace(/_/g, "/");
  const buff = new Buffer(base64, "base64");
  const decoded = buff.toString("ascii");

  const jsonPayload = decodeURIComponent(
    decoded
      .split("")
      .map((c) => {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );

  return JSON.parse(jsonPayload) as T;
}

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
      reject(new Error("Invalid audience"));
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
        reject(new Error("Missing Client Secret for HS256 encoded JWT"));
      }
    } else if (alg === "RS256") {
      if (kid) {
        if (JWKS) {
          const validKey = JWKS.keys.find((keyObject) =>
            Object.entries(keyObject).find(([key, value]) => {
              return key === "kid" && value === kid;
            }),
          );

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
            reject(new Error("Invalid key ID for HS256 encoded JWT"));
          }
        } else {
          reject(new Error("Missing JWKS URI for HS256 encoded JWT"));
        }
      } else {
        reject(new Error("Missing key id for HS256 encoded JWT"));
      }
    } else {
      reject(new Error("Encoding algo not supported"));
    }
  });
}
