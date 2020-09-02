import jwt from "jsonwebtoken";

import {
  MissingJWKSURI,
  InvalidKeyIDRS256,
  MissingKeyIDHS256,
  AlgoNotSupported,
  InvalidAudience,
} from "./src/errors";
import {
  OpenIDConfiguration,
  OAuth2ClientConstructor,
  JWKSDT,
} from "./src/types";
import { decodeJWTPart } from "./src/utils/decodeJWTPart";
import { rsaPublicKeyToPEM } from "./src/utils/rsaPublicKeyToPEM";

class OAuth2Client {
  openIDConfigurationURL: string;
  clientID: string;
  clientSecret: string;
  redirectURI: string;
  audience: string;
  openIDConfiguration?: OpenIDConfiguration;

  constructor({
    openIDConfigurationURL,
    clientID,
    clientSecret,
    redirectURI,
    audience,
  }: OAuth2ClientConstructor) {
    this.openIDConfigurationURL = openIDConfigurationURL;
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.redirectURI = redirectURI;
    this.audience = audience;
  }

  private async setOpenIDConfiguration(): Promise<void> {
    if (this.openIDConfiguration) {
      return Promise.resolve();
    } else {
      await fetch(this.openIDConfigurationURL)
        .then((response) => response.json())
        .then((openIDConfiguration) => {
          this.openIDConfiguration = openIDConfiguration;
        })
        .catch((error) => {
          throw error;
        });
    }
  }

  async getAuthorizationURL(): Promise<URL> {
    await this.setOpenIDConfiguration();

    const authorizeURL = new URL(
      this.openIDConfiguration.authorization_endpoint,
    );

    authorizeURL.searchParams.append("client_id", this.clientID);
    authorizeURL.searchParams.append("response_type", "code");
    authorizeURL.searchParams.append(
      "redirect_uri",
      encodeURIComponent(decodeURIComponent(this.redirectURI)),
    );
    authorizeURL.searchParams.append(
      "scope",
      this.openIDConfiguration.scopes_supported.join(" "),
    );

    return authorizeURL;
  }

  private async getJWKS(): Promise<JWKSDT> {
    await this.setOpenIDConfiguration();

    const JWKS: JWKSDT = await fetch(this.openIDConfiguration.jwks_uri)
      .then((response) => response.json())
      .catch((error) => {
        throw error;
      });

    return JWKS;
  }

  async getTokensFromAuthorizationCode(
    authorizationCode: string,
  ): Promise<string[]> {
    await this.setOpenIDConfiguration();

    const callback = {
      client_id: this.clientID,
      client_secret: this.clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
      redirect_uri: this.redirectURI,
    };

    const tokens = await fetch(this.openIDConfiguration.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callback),
    })
      .then((response) => response.json())
      .catch((error) => {
        throw error;
      });

    return tokens;
  }

  async verifyJWT<T = unknown>(accessToken: string, algo: string): Promise<T> {
    await this.setOpenIDConfiguration();

    const JWKS = await this.getJWKS();

    return new Promise((resolve, reject) => {
      const [header, payload] = accessToken.split(".");

      const { alg, kid } = decodeJWTPart<{ alg: string; kid: string }>(header);
      const { aud } = decodeJWTPart<{ aud: string }>(payload);

      if (
        (typeof aud === "string" && aud !== this.audience) ||
        (Array.isArray(aud) && !aud.includes(this.audience))
      ) {
        reject(new InvalidAudience("Invalid audience"));
      }

      if (alg === "HS256" && algo === "HS256") {
        jwt.verify(
          accessToken,
          this.clientSecret,
          {
            algorithms: ["HS256"],
          },
          (error: jwt.VerifyErrors | null, decoded: unknown) => {
            return error ? reject(error) : resolve(decoded as T);
          },
        );
      } else if (alg === "RS256" && algo === "RS256") {
        if (kid) {
          if (JWKS) {
            const validKey = JWKS.keys.find(
              (keyObject) => keyObject.kid === kid,
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
              reject(
                new InvalidKeyIDRS256(
                  "Invalid key ID (kid) for RS256 encoded JWT",
                ),
              );
            }
          } else {
            reject(
              new MissingJWKSURI("Missing JWKS URI for RS256 encoded JWT"),
            );
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
}

export default OAuth2Client;

export {
  OpenIDConfiguration,
  OAuth2ClientConstructor,
  decodeJWTPart,
  rsaPublicKeyToPEM,
  MissingJWKSURI,
  InvalidKeyIDRS256,
  MissingKeyIDHS256,
  AlgoNotSupported,
  InvalidAudience,
};
