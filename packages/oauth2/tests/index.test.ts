import fetch from "jest-fetch-mock";
import { enableFetchMocks } from "jest-fetch-mock";

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

describe("OAuth2Client", () => {
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

  const mockedOpenIdConf: OpenIDConfiguration = {
    userinfo_signing_alg_values_supported: ["none"],
    userinfo_endpoint: "",
    token_endpoint_auth_signing_alg_values_supported: ["HS256", "RS256"],
    token_endpoint_auth_methods_supported: [""],
    token_endpoint: "http://mocked-tokens-endpoint.test",
    subject_types_supported: "",
    scopes_supported: ["email phone"],
    response_types_supported: ["code"],
    request_uri: false,
    request_parameter_supported: false,
    jwks_uri: "http://mocked-jwks-uri.test",
    issuer: "",
    id_token_signing_alg_values_supported: ["HS256", "RS256"],
    grant_types_supported: [""],
    claims_supported: ["normal", "distributed"],
    claim_types_supported: [""],
    authorization_endpoint: "http://mocked-auth-endpoint.test",
  };

  describe("getAuthorizationURL", () => {
    test("should initialize the openIDConfiguration", async () => {
      expect.assertions(2);

      fetch.once(JSON.stringify(mockedOpenIdConf));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      await oauthClient.getAuthorizationURL();

      expect(oauthClient.openIDConfiguration).not.toBe(undefined);
      expect(oauthClient.openIDConfiguration).toEqual(
        expect.objectContaining(mockedOpenIdConf),
      );
    });

    test("it should return a valid auth URL", async () => {
      expect.assertions(1);

      fetch.once(JSON.stringify(mockedOpenIdConf));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      const authURL = await oauthClient.getAuthorizationURL();

      const expectedAuthURL =
        "http://mocked-auth-endpoint.test/?client_id=mockedClientID&response_type=code&redirect_uri=mockedRedirectURI&scope=email+phone";

      expect(authURL.href).toMatch(expectedAuthURL);
    });
  });

  describe("getJWKS", () => {
    test("should initialize the openIDConfiguration", async () => {
      expect.assertions(2);

      fetch.once(JSON.stringify(mockedOpenIdConf));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      await oauthClient.getAuthorizationURL();

      expect(oauthClient.openIDConfiguration).not.toBe(undefined);
      expect(oauthClient.openIDConfiguration).toEqual(
        expect.objectContaining(mockedOpenIdConf),
      );
    });

    test("should return a JWKS", async () => {
      expect.assertions(1);

      fetch.once(JSON.stringify(mockedOpenIdConf));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      const mockedJWKS = {
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

      fetch.once(JSON.stringify(mockedJWKS));

      const JWKS = await oauthClient.getJWKS();

      expect(JWKS).toEqual(expect.objectContaining(mockedJWKS));
    });
  });

  describe("getTokensFromAuthorizationCode", () => {
    test("should initialize the openIDConfiguration", async () => {
      expect.assertions(2);

      fetch.once(JSON.stringify(mockedOpenIdConf));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      await oauthClient.getAuthorizationURL();

      expect(oauthClient.openIDConfiguration).not.toBe(undefined);
      expect(oauthClient.openIDConfiguration).toEqual(
        expect.objectContaining(mockedOpenIdConf),
      );
    });

    test("should return the tokens from connect", async () => {
      expect.assertions(1);

      const mockedOAuthTokens = {
        token_type: "Bearer",
        scope: "openid email phone",
        refresh_token: "mockedRefreshToken",
        id_token: "mockedIdToken",
        expires_in: 3600,
        access_token: "mockedAccessToken",
      };

      fetch.once(JSON.stringify(mockedOpenIdConf));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      fetch.once(JSON.stringify(mockedOAuthTokens));

      const mockedAuthCode = "foo";

      const expectedTokens = await oauthClient.getTokensFromAuthorizationCode(
        mockedAuthCode,
      );

      expect(expectedTokens).toEqual(
        expect.objectContaining(mockedOAuthTokens),
      );
    });
  });
});
