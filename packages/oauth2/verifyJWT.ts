import jwt from "jsonwebtoken";

function decodeJWTPart(JWTPart: string): Record<string, unknown> {
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

  return JSON.parse(jsonPayload);
}

export async function verifyJWT<T>(
  accessToken: string,
  audience: string | string[],
  clientSecret?: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const [header, payload] = accessToken.split(".");

    const { alg, kid } = decodeJWTPart(header);
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
        // get JWKS
        // jwt kid find in curled kid

        // https://github.com/auth0/node-jwks-rsa/blob/44beb3b6b62335eb618efe28b47883369acd3964/src/utils.js#L35
        // Decode with jsonwebtoken

        console.log();
      } else {
        reject(new Error("Missing key id for HS256 encoded JWT"));
      }
    } else {
      reject(new Error("Encoding algo not supported"));
    }
  });
}
