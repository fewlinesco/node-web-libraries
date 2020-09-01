import OAuth2Client from "index";

export type JWKS = {
  keys: {
    use: string;
    n: string;
    kty: string;
    kid: string;
    e: string;
    alg: string;
  }[];
};

export async function getJWKS(Oauth2Client: OAuth2Client): Promise<JWKS> {
  const JWKS: JWKS = await fetch(
    Oauth2Client.openIDConfiguration.jwks_uri,
  ).then((response) => response.json());

  return JWKS;
}
