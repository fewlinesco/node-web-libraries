import crypto from "crypto";
import fetch from "jest-fetch-mock";
import { enableFetchMocks } from "jest-fetch-mock";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import jose from "node-jose";

import OAuth2Client, {
  InvalidAudience,
  InvalidKeyIDRS256,
  MissingKeyIDHS256,
  AlgoNotSupported,
  ScopesNotSupported,
  defaultSecret,
  OAuth2ClientConstructor,
  defaultPayload,
  OpenIDConfiguration,
  generateHS256JWS,
} from "../index";

enableFetchMocks();

describe("OAuth2Client", () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  const oauthClientConstructorProps: OAuth2ClientConstructor = {
    openIDConfigurationURL: "http://mocked-openid-url.test",
    clientID: "7dc44ab1-177a-459f-8be5-e485f16c8e87",
    clientSecret: defaultSecret,
    redirectURI: "http://mocked-redirect-url.test",
    audience: defaultPayload.aud[0],
    scopes: ["email", "phone"],
    fetch: fetch,
  };

  const mockedOpenIdConf: OpenIDConfiguration = {
    userinfo_signing_alg_values_supported: ["none"],
    userinfo_endpoint: "http://mocked-userinfo-endpoint.test",
    token_endpoint_auth_signing_alg_values_supported: ["HS256", "RS256"],
    token_endpoint_auth_methods_supported: [""],
    token_endpoint: "http://mocked-tokens-endpoint.test",
    subject_types_supported: "client_secret_basic",
    scopes_supported: ["email", "phone", "openid"],
    response_types_supported: ["code"],
    request_uri: false,
    request_parameter_supported: false,
    jwks_uri: "http://mocked-jwks-uri.test",
    issuer: "",
    id_token_signing_alg_values_supported: ["HS256", "RS256"],
    grant_types_supported: ["authorization_code"],
    claims_supported: ["normal", "distributed"],
    claim_types_supported: [""],
    authorization_endpoint: "http://mocked-auth-endpoint.test",
  };

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

      const expectedAuthURL = `http://mocked-auth-endpoint.test/?client_id=${oauthClientConstructorProps.clientID}&response_type=code&redirect_uri=http%3A%2F%2Fmocked-redirect-url.test&scope=email+phone`;

      expect(authURL.href).toMatch(expectedAuthURL);
    });

    test("it should add the state at the end of the query string", async () => {
      expect.assertions(1);

      fetch.once(JSON.stringify(mockedOpenIdConf));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      const authURL = await oauthClient.getAuthorizationURL("http://foo.bar");

      const expectedAuthURL = `http://mocked-auth-endpoint.test/?client_id=${oauthClientConstructorProps.clientID}&response_type=code&redirect_uri=http%3A%2F%2Fmocked-redirect-url.test&scope=email+phone&state=http%3A%2F%2Ffoo.bar`;

      expect(authURL.href).toMatch(expectedAuthURL);
    });

    test("is should throw an error if the provided scopes are not supported", async () => {
      expect.assertions(2);

      fetch
        .once(JSON.stringify(mockedOpenIdConf))
        .once(JSON.stringify(mockedJWKS));

      const oauthClient = new OAuth2Client({
        ...oauthClientConstructorProps,
        scopes: ["github"],
      });

      await oauthClient.getAuthorizationURL().catch((error) => {
        expect(error).toBeInstanceOf(ScopesNotSupported);
        expect(error.message).toBe("Scopes are not supported");
      });
    });
  });

  describe("getTokensFromAuthorizationCode", () => {
    test("should initialize the openIDConfiguration", async () => {
      expect.assertions(2);

      fetch.once(JSON.stringify(mockedOpenIdConf)).once(JSON.stringify({}));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      await oauthClient.getTokensFromAuthorizationCode("mockedAuthCode");

      expect(oauthClient.openIDConfiguration).not.toBe(undefined);
      expect(oauthClient.openIDConfiguration).toEqual(
        expect.objectContaining(mockedOpenIdConf),
      );
    });

    test("should return the tokens from connect", async () => {
      expect.assertions(1);

      const mockedAuthCode = "foo";

      const mockedOAuthTokens = {
        token_type: "Bearer",
        scope: "openid email phone",
        refresh_token: "mockedRefreshToken",
        id_token: "mockedIdToken",
        expires_in: 3600,
        access_token: "mockedAccessToken",
      };

      fetch
        .once(JSON.stringify(mockedOpenIdConf))
        .once(JSON.stringify(mockedOAuthTokens));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      const tokens = await oauthClient.getTokensFromAuthorizationCode(
        mockedAuthCode,
      );

      const expectedTokens = {
        refresh_token: "mockedRefreshToken",
        id_token: "mockedIdToken",
        access_token: "mockedAccessToken",
      };

      expect(expectedTokens).toEqual(expect.objectContaining(tokens));
    });
  });

  describe("verifyJWT", () => {
    const HS256JWT = generateHS256JWS();

    test("should initialize the openIDConfiguration", async () => {
      expect.assertions(2);

      fetch
        .once(JSON.stringify(mockedOpenIdConf))
        .once(JSON.stringify(mockedJWKS));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      await oauthClient.verifyJWT(HS256JWT, "HS256");

      expect(oauthClient.openIDConfiguration).not.toBe(undefined);
      expect(oauthClient.openIDConfiguration).toEqual(
        expect.objectContaining(mockedOpenIdConf),
      );
    });

    test("is should throw an error if wrong audience", async () => {
      expect.assertions(2);

      fetch
        .once(JSON.stringify(mockedOpenIdConf))
        .once(JSON.stringify(mockedJWKS));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      const wrongAudienceHS256JWT = generateHS256JWS(
        { ...defaultPayload, aud: ["foo"] },
        defaultSecret,
      );

      await oauthClient
        .verifyJWT(wrongAudienceHS256JWT, "HS256")
        .catch((error) => {
          expect(error).toBeInstanceOf(InvalidAudience);
          expect(error.message).toBe("Invalid audience");
        });
    });

    describe("HS256 signed JWT", () => {
      test("it should return the JWT payload if a well formed JWT and a client secret are provided", async () => {
        expect.assertions(2);

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(mockedJWKS));

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        const decoded = await oauthClient.verifyJWT(HS256JWT, "HS256");

        expect(decoded).not.toBe(undefined);
        expect(decoded).toEqual(expect.objectContaining(defaultPayload));
      });

      test("it should throw an error if using the wrong client secret", async () => {
        expect.assertions(1);

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(mockedJWKS));

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        const wrongClientSecretHS256JWT = generateHS256JWS(
          defaultPayload,
          "wrong-client-secret",
        );

        await oauthClient
          .verifyJWT(wrongClientSecretHS256JWT, "HS256")
          .catch((error) => expect(error).toBeInstanceOf(JsonWebTokenError));
      });

      test("it should throw an error if using a malformed JWT", async () => {
        expect.assertions(1);

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(mockedJWKS));

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        await oauthClient
          .verifyJWT("foo", "HS256")
          .catch((error) => expect(error).toBeInstanceOf(SyntaxError));
      });
    });

    describe("RS256 signed JWT", () => {
      const RS256JWT =
        "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ2NTEyZjUzLTk3NzQtNGE1OC04MzBjLTk4MTg4NmM4YmI0MyIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiY29ubmVjdC1hY2NvdW50Il0sImV4cCI6MjUyNDY1MTIwMCwiaXNzIjoiaHR0cHM6Ly9icy1wcm92aWRlci5wcm9kLmNvbm5lY3QuY29ubmVjdC5hd3MuZXUtd2VzdC0yLms4cy5mZXdsaW5lcy5uZXQiLCJzY29wZSI6InByb2ZpbGUgZW1haWwiLCJzdWIiOiJjNGIxY2I1OS0xYzUwLTQ5NGEtODdlNS0zMmE1ZmU2ZTdjYWEifQ.dRw3QknDU9KOQR44tKLYkkasQvUenN3dbBai2f7omSpf1NCYSorisVpKUhS6luyhtZhL5H8q8oY95WlfU7XEdMk4iW9-VGlrWCVhD-NDdFC2nc_drz9aJm_tZDY-NL5l63PJuRchFmPuKEoehAQ6ZJfK63o_0VsutCQAOpqSocI";

      const oauthClient = new OAuth2Client({
        ...oauthClientConstructorProps,
        audience: "connect-account",
      });

      test("It should return a decoded jwt if valid", async () => {
        expect.assertions(2);

        const mockedDecodedJWT = {
          aud: ["connect-account"],
          exp: 2524651200,
          iss:
            "https://bs-provider.prod.connect.connect.aws.eu-west-2.k8s.fewlines.net",
          scope: "profile email",
          sub: "c4b1cb59-1c50-494a-87e5-32a5fe6e7caa",
        };

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(mockedJWKS));

        const decodedJWT = await oauthClient.verifyJWT(RS256JWT, "RS256");

        expect(decodedJWT).not.toBe(undefined);
        expect(decodedJWT).toEqual(expect.objectContaining(mockedDecodedJWT));
      });

      test("should throw an error if invalid key id", async () => {
        expect.assertions(2);

        const wrongKidJWKS = {
          keys: [
            {
              e: "AQAB",
              kty: "RSA",
              kid: "wrongKid",
              n:
                "y3M7JqY49JeL/ornP7ZY2QlO76akS36Rj1iKVSIlFH754NnqmtGwMrCVZzCWrc882trbGuDhml2psOmCIBjKBpnghNLBZALGNRelCqfV7Cy+EMrQvQ+UWbogT7xfPoL+VYjCZKTeXosfzMNMZFum/Vnk/vYBKilXZfQH1t4sohU=",
              alg: "RS256",
            },
          ],
        };

        const oauthClient = new OAuth2Client({
          ...oauthClientConstructorProps,
          audience: "connect-account",
        });

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(wrongKidJWKS));

        await oauthClient.verifyJWT(RS256JWT, "RS256").catch((error) => {
          expect(error).toBeInstanceOf(InvalidKeyIDRS256);
          expect(error.message).toBe(
            "Invalid key ID (kid) for RS256 encoded JWT",
          );
        });
      });

      test("should throw an error if missing key id", async () => {
        expect.assertions(2);

        const passphrase = "top secret";
        const { privateKey } = crypto.generateKeyPairSync("rsa", {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
            cipher: "aes-256-cbc",
            passphrase,
          },
        });

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(mockedJWKS));

        const missingKidJWT = jwt.sign(
          { audience: "fooBar" },
          { key: privateKey, passphrase },
          {
            algorithm: "RS256",
          },
        );

        await oauthClient.verifyJWT(missingKidJWT, "RS256").catch((error) => {
          expect(error).toBeInstanceOf(MissingKeyIDHS256);
          expect(error.message).toBe(
            "Missing key ID (kid) for RS256 encoded JWT",
          );
        });
      });

      test("it should throw an error algo is != from RS256 or HS256", async () => {
        expect.assertions(2);

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(mockedJWKS));

        const noAlgoJWT = jwt.sign({ audience: "fooBar" }, "fooBar", {
          algorithm: "none",
        });

        await oauthClient.verifyJWT(noAlgoJWT, "RS256").catch((error) => {
          expect(error).toBeInstanceOf(AlgoNotSupported);
          expect(error.message).toBe("Encoding algo not supported");
        });
      });
    });
  });

  describe("decrypt JWE", () => {
    test("it should correctly decrypt JWE based on a JWS", async () => {
      expect.assertions(1);

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      const passphraseSignature = "top secret";
      const { privateKey: privateKeyForSignature } = crypto.generateKeyPairSync(
        "rsa",
        {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
            cipher: "aes-256-cbc",
            passphrase: passphraseSignature,
          },
        },
      );

      const {
        publicKey: publicKeyForEncryption,
        privateKey: privateKeyForEncryption,
      } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
        },
      });

      const mockedSignedJWT = jwt.sign(defaultPayload, privateKeyForSignature);

      const josePublicKeyForEncryption = await jose.JWK.asKey(
        publicKeyForEncryption,
        "pem",
      );

      const mockedJWEWithJWS = await jose.JWE.createEncrypt(
        { format: "compact" },
        josePublicKeyForEncryption,
      )
        .update(Buffer.from(mockedSignedJWT))
        .final();

      const decryptedMockedJWEWithJWS = await oauthClient.decryptJWE<string>(
        mockedJWEWithJWS,
        privateKeyForEncryption,
        true,
      );

      expect(decryptedMockedJWEWithJWS).toStrictEqual(mockedSignedJWT);
    });

    test("it should correctly decrypt a JWE based on non-signed JWT", async () => {
      expect.assertions(1);

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      const mockedAccessTokenClearPayload = {
        exp: 1605010807,
        iss: "fewlines",
        sub: "3dafcd27-a3a8-4a7e-81a3-9dd4cea44cfb",
        aud: ["fenn"],
        scope: "openid phone email",
      };
      const mockedJWEAccessToken =
        "eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMTI4R0NNIn0.w4eo3k66Kr20CVrUQYDCgIR9ZFTFmbdtHvCGEGEYqQt3xJKo1zDT8nrkApHBTWgpg09BrvToBcHYhpZSCV9dbMSzjPWvjNlQTr5f7lOQ4Q34MQaCmH3LWr5toCYGl9iXJLolpW-r9vQNuwJIoYIinycXYJMCMgT72miKbHC66qJf1YoOgOqC9fc8E4V79fYuAaLmalEncqJHTn_u67e5qEZNqRrgFlxd4b9IPhMuRmaP3OICvtSFBIuFH64gVke6ckOwK-mGIIA-qQzwgkZrWnddmIMWKhSR7CwtXzKY46alHJrN1pvaAHBVqHCKi3JtBL_sCtpVZXHfCmhBqWcW2A.vxelVyonD7vTWBYX.yz7wOYxlwTRGeuABqlQ110Sw28nFsHjBig9kwyGFz4D6fqjrY_6mM2fYBZDbPuviumQifJ3vDvilV4dkIXJ9csSEgLlaLOK043kpT2T-2_XFnxdG7sfBHRimsg_ag889OjdZiGT4hMK-K_0lyZ8dOTHgcRMpLApX_s8Cog.kxPk7co7dttJ9l9ZrKxV9g";

      const mockedPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
        MIIEogIBAAKCAQEAyI/9q9TjkglfDJebAjC5vt6HFZYthcU2rc2/4bIETIUkwDcf
        PoTrSFarccZ9pl9bAXlMfKhc6LcRB6XcBWACeDoblbgMzaZ/4rTUGrReUHB0HpmZ
        kyXDkN8iezTNG2gKRhVrS2rjlpLKMIDKVfG/xXsNQmT4iVs07MBSJToTKT2lIzbE
        u4sEZz9GUhwffeKBmh3uxX+ELxpp++eShD3pGPo5l3mkozEYRpa5tK2aXHfgNm1+
        KLkWq9uNd+msj/4lC0AxQ5a8re4z5zP2IJoN9buJqvV7e8lpKoAPJ76jcBEEeZBD
        LNvP+ZXcSRkhj6l/cJjYgQcr8DtoJ97F0MWlywIDAQABAoIBABCP837RIcnZhEPh
        8ScJJw2gCr+5myDE3HMV3pagwMIg7JwC8U2UZGmg3p+SqKWokjdY8PwKW0HMfFeJ
        VtYKy6lqAwUmIciJy13JWQqrgm5aGvy76nbAU5oPEyXhgl6VBOQsuKONvCWfEZtX
        x125jQCd3MZy2CNfqMs0RpRUa2ioTSI2JWJnqsYuNEHysgCL9+jtEqDm62Qmp4nG
        F02+EZilu8wM5XOKkv7Q/zsSimjTP5rXxAVhvlUvsJGTj67fFRnoY4LmAkSramgO
        CHgvb3+GjiCbu4WFFf06P89dvt5Q6OtjWJEojmgbrrmjk9ccBtD4wtIS/JfbuIMF
        jnDVMqECgYEA4pyN9pQGuXutEYZ4wAi8FR++ruNbPscuorUID/uW137H3oTuLXig
        L2u64F7JQ9692sXfecmL53goY2+qSNo7xdfBSoF0q8MLlWL0VhU6S9vYHqa2TjDX
        WPzNuQWIlxWzKTUVj0Jfw5TBbri+PaTn4hMEPCqkzbdW2sK4XZ0zU+cCgYEA4pKd
        F+t825Prxqsky1e6vfwfgdLuhZeBRLPHzssAB0GtsvhmsBj36JmU/OdPXDKIPShO
        fx0/jRmuureja+uNlXUUsBxQXfz4O5XS/otIsI3GxO415kezRNvB/eLAogO4JTvz
        zH1B+1VnsBpealFQYGSZ6xqCN94OunyDnjPHIn0CgYBQPasvEr9G0no36Gu9Y9pl
        iHYWqz7V/eWPi5atQiLpb2UKb/t+cmYWJIlphWay9542ZzZ4g1tcvPlgLFwZq9za
        c0loPmq3nzrszLtD+ARKdDAUumd3TGgUhH+78i+pf++OudNGhPQv5u6PbC9A2LGb
        JaysOVVd2nuQvr5Vt6JDJQKBgGwU4omJlXstmhighaHWzMdaYTFODOh/eHPsixEz
        t2S+yPyKEHpKvuAfe3oVYb8qf+EkvCVZL3rA2KBLf9K4gEbenirQpunfBg9ujkNM
        8DUAvOQuelnKtFLRvj29kIT43zwr2EYhLnuVpyvTuFxhQ8Vn2CDV+W5rKH1/bk3m
        h0UFAoGAOWOocpeq5LpV0IYjvGUqPol/eVLU8TjHcesPbRpyYGPx6GgG2yFAtvQT
        q/PrBnwqO+Qfe+TRkMPuCpvUFwZq7ytKlPiBCV5LqdmhoouZtA9fCulK47kwRQQt
        8GdyvRZzfC3P2vdaezSk3Wv3bqhXmu7R4JXx+jFg1mao/i+BwfM=
        -----END RSA PRIVATE KEY-----`;

      const decryptedMockedJWEAccessToken = await oauthClient.decryptJWE<{
        iss: string;
      }>(mockedJWEAccessToken, mockedPrivateKey, false);

      expect(decryptedMockedJWEAccessToken.iss).toStrictEqual(
        mockedAccessTokenClearPayload.iss,
      );
    });
  });
});
