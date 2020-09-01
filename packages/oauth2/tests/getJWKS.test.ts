import fetch from "jest-fetch-mock";
import { enableFetchMocks } from "jest-fetch-mock";

import { getJWKS } from "../getJWKS";
import OAuth2Client from "../index";
import { OAuth2ClientConstructor, OpenIDConfiguration } from "../types";

enableFetchMocks();

const mockedFetchResponse = {
  keys: [
    {
      e: "AQAB",
      kty: "RSA",
      kid: "d6512f53-9774-4a58-830c-981886c8bb43",
      n:
        "y3M7JqY49JeL/ornP7ZY2QlO76akS36Rj1iKVSIlFH754NnqmtGwMrCVZzCWrc882trbGuDhml2psOmCIBjKBpnghNLBZALGNRelCqfV7Cy+EMrQvQ+UWbogT7xfPoL+VYjCZKTeXosfzMNMZFum/Vnk/vYBKilXZfQH1t4sohU=",
      alg: "RS256",
    },
  ],
};

describe("getJWKS", () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  const oauthClientConstructorProps: OAuth2ClientConstructor = {
    openIDConfigurationURL: "mockedOpenIdConfURL",
    clientID: "mockedClientID",
    clientSecret: "mockedClientSecret",
    redirectURI: "mockedRedirectURI",
    audience: "mockedAudience",
  };

  const oauthClient = new OAuth2Client(oauthClientConstructorProps);

  const mockedOpenIdConf: OpenIDConfiguration = {
    userinfo_signing_alg_values_supported: ["none"],
    userinfo_endpoint: "",
    token_endpoint_auth_signing_alg_values_supported: ["HS256", "RS256"],
    token_endpoint_auth_methods_supported: [""],
    token_endpoint: "",
    subject_types_supported: "",
    scopes_supported: ["email phone"],
    response_types_supported: ["code"],
    request_uri: false,
    request_parameter_supported: false,
    jwks_uri: "mockedJWKSURI",
    issuer: "",
    id_token_signing_alg_values_supported: ["HS256", "RS256"],
    grant_types_supported: [""],
    claims_supported: ["normal", "distributed"],
    claim_types_supported: [""],
    authorization_endpoint: "",
  };

  test("it should fetch the JWKS", async () => {
    fetch.once(JSON.stringify(mockedOpenIdConf));

    const JWKS = await getJWKS(oauthClient);

    console.log(JWKS);

    expect(1).toBe(1);
  });
});
