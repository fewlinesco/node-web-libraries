import jwt from "jsonwebtoken";
import nodeFetch from "node-fetch";

import {
  MissingJWKSURI,
  InvalidKeyIDRS256,
  MissingKeyIDHS256,
  AlgoNotSupported,
  InvalidAudience,
  ScopesNotSupported,
} from "./src/errors";
import {
  OpenIDConfiguration,
  OAuth2ClientConstructor,
  JWKSDT,
  OAuth2Tokens,
} from "./src/types";
import { decodeJWTPart } from "./src/utils/decodeJWTPart";
import { rsaPublicKeyToPEM } from "./src/utils/rsaPublicKeyToPEM";

class OAuth2Client {
  readonly openIDConfigurationURL: string;
  readonly clientID: string;
  readonly clientSecret: string;
  readonly redirectURI: string;
  readonly audience: string;
  readonly scopes: string[];
  private fetch: any;
  openIDConfiguration?: OpenIDConfiguration;

  constructor({
    openIDConfigurationURL,
    clientID,
    clientSecret,
    redirectURI,
    audience,
    scopes,
    fetch,
  }: OAuth2ClientConstructor) {
    this.openIDConfigurationURL = openIDConfigurationURL;
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.redirectURI = redirectURI;
    this.audience = audience;
    this.scopes = scopes;
    this.fetch = fetch ? fetch : nodeFetch;
  }

  private async setOpenIDConfiguration(): Promise<void> {
    if (this.openIDConfiguration) {
      return Promise.resolve();
    } else {
      await this.fetch(this.openIDConfigurationURL)
        .then((response) => response.json())
        .then((openIDConfiguration) => {
          this.openIDConfiguration = openIDConfiguration;
        })
        .catch((error) => {
          throw error;
        });
    }
  }

  private async getJWKS(): Promise<JWKSDT> {
    await this.setOpenIDConfiguration();

    const JWKS: JWKSDT = await this.fetch(this.openIDConfiguration.jwks_uri)
      .then((response) => response.json())
      .catch((error) => {
        throw error;
      });

    return JWKS;
  }

  async getAuthorizationURL(state?: string): Promise<URL> {
    await this.setOpenIDConfiguration();

    const {
      authorization_endpoint,
      scopes_supported,
    } = this.openIDConfiguration;

    const areScopesSupported = this.scopes.every((scope) =>
      scopes_supported.includes(scope),
    );

    if (!areScopesSupported) {
      throw new ScopesNotSupported("Scopes are not supported");
    }

    const authorizeURL = new URL(authorization_endpoint);

    authorizeURL.searchParams.append("client_id", this.clientID);
    authorizeURL.searchParams.append("response_type", "code");
    authorizeURL.searchParams.append(
      "redirect_uri",
      encodeURIComponent(decodeURIComponent(this.redirectURI)),
    );
    authorizeURL.searchParams.append("scope", this.scopes.join(" "));

    if (state) {
      authorizeURL.searchParams.append(
        "state",
        encodeURIComponent(decodeURIComponent(state)),
      );
    }

    return authorizeURL;
  }

  async getTokensFromAuthorizationCode(
    authorizationCode: string,
  ): Promise<OAuth2Tokens> {
    await this.setOpenIDConfiguration();

    const callback = {
      client_id: this.clientID,
      client_secret: this.clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
      redirect_uri: this.redirectURI,
    };

    const tokenEndpointResponse = await this.fetch(
      this.openIDConfiguration.token_endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(callback),
      },
    )
      .then((response) => response.json())
      .catch((error) => {
        throw error;
      });

    const { access_token, refresh_token, id_token } = tokenEndpointResponse;

    return { access_token, refresh_token, id_token };
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
  ScopesNotSupported,
  OAuth2Tokens,
};
