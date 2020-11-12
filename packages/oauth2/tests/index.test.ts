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
} from "../index";
import { OAuth2ClientConstructor, OpenIDConfiguration } from "../src/types";
import { jose2 } from "../src/utils/jose2";

enableFetchMocks();

describe("OAuth2Client", () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  const oauthClientConstructorProps: OAuth2ClientConstructor = {
    openIDConfigurationURL: "http://mocked-openid-url.test",
    clientID: "mockedClientID",
    clientSecret: "mockedClientSecret",
    redirectURI: "http://mocked-redirect-url.test",
    audience: "connect-account",
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

  const mockedJWTPayload = {
    aud: ["connect-account"],
    exp: Date.now() + 300,
    iss: "foo",
    scope: "phone email",
    sub: "2a14bdd2-3628-4912-a76e-fd514b5c27a8",
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
        "http://mocked-auth-endpoint.test/?client_id=mockedClientID&response_type=code&redirect_uri=http%3A%2F%2Fmocked-redirect-url.test&scope=email+phone";

      expect(authURL.href).toMatch(expectedAuthURL);
    });

    test("it should add the state at the end of the query string", async () => {
      expect.assertions(1);

      fetch.once(JSON.stringify(mockedOpenIdConf));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      const authURL = await oauthClient.getAuthorizationURL("http://foo.bar");

      const expectedAuthURL =
        "http://mocked-auth-endpoint.test/?client_id=mockedClientID&response_type=code&redirect_uri=http%3A%2F%2Fmocked-redirect-url.test&scope=email+phone&state=http%3A%2F%2Ffoo.bar";

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
    const { clientSecret } = oauthClientConstructorProps;

    const RS256 = "RS256";
    const HS256 = "HS256";
    const HS256JWT = jwt.sign(mockedJWTPayload, clientSecret, {
      algorithm: HS256,
    });

    test("should initialize the openIDConfiguration", async () => {
      expect.assertions(2);

      fetch
        .once(JSON.stringify(mockedOpenIdConf))
        .once(JSON.stringify(mockedJWKS));

      const oauthClient = new OAuth2Client(oauthClientConstructorProps);

      await oauthClient.verifyJWT(HS256JWT, HS256);

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

      const wrongAudienceHS256JWT = jwt.sign(
        { ...mockedJWTPayload, aud: "foo" },
        clientSecret,
        {
          algorithm: HS256,
        },
      );

      await oauthClient
        .verifyJWT(wrongAudienceHS256JWT, HS256)
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

        const decoded = await oauthClient.verifyJWT(HS256JWT, HS256);

        expect(decoded).not.toBe(undefined);
        expect(decoded).toEqual(expect.objectContaining(mockedJWTPayload));
      });

      test("it should throw an error if using the wrong client secret", async () => {
        expect.assertions(1);

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(mockedJWKS));

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        const wrongClientSecretHS256JWT = jwt.sign(mockedJWTPayload, "foo");

        await oauthClient
          .verifyJWT(wrongClientSecretHS256JWT, HS256)
          .catch((error) => expect(error).toBeInstanceOf(JsonWebTokenError));
      });

      test("it should throw an error if using a malformed JWT", async () => {
        expect.assertions(1);

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(mockedJWKS));

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        await oauthClient
          .verifyJWT("foo", HS256)
          .catch((error) => expect(error).toBeInstanceOf(SyntaxError));
      });
    });

    describe("RS256 signed JWT", () => {
      const RS256JWT =
        "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ2NTEyZjUzLTk3NzQtNGE1OC04MzBjLTk4MTg4NmM4YmI0MyIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiY29ubmVjdC1hY2NvdW50Il0sImV4cCI6MjUyNDY1MTIwMCwiaXNzIjoiaHR0cHM6Ly9icy1wcm92aWRlci5wcm9kLmNvbm5lY3QuY29ubmVjdC5hd3MuZXUtd2VzdC0yLms4cy5mZXdsaW5lcy5uZXQiLCJzY29wZSI6InByb2ZpbGUgZW1haWwiLCJzdWIiOiJjNGIxY2I1OS0xYzUwLTQ5NGEtODdlNS0zMmE1ZmU2ZTdjYWEifQ.dRw3QknDU9KOQR44tKLYkkasQvUenN3dbBai2f7omSpf1NCYSorisVpKUhS6luyhtZhL5H8q8oY95WlfU7XEdMk4iW9-VGlrWCVhD-NDdFC2nc_drz9aJm_tZDY-NL5l63PJuRchFmPuKEoehAQ6ZJfK63o_0VsutCQAOpqSocI";

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

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        const decodedJWT = await oauthClient.verifyJWT(RS256JWT, RS256);

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

        fetch
          .once(JSON.stringify(mockedOpenIdConf))
          .once(JSON.stringify(wrongKidJWKS));

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        await oauthClient.verifyJWT(RS256JWT, RS256).catch((error) => {
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

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        const missingKidJWT = jwt.sign(
          { audience: "fooBar" },
          { key: privateKey, passphrase },
          {
            algorithm: RS256,
          },
        );

        await oauthClient.verifyJWT(missingKidJWT, RS256).catch((error) => {
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

        const oauthClient = new OAuth2Client(oauthClientConstructorProps);

        const noAlgoJWT = jwt.sign({ audience: "fooBar" }, "fooBar", {
          algorithm: "none",
        });

        await oauthClient.verifyJWT(noAlgoJWT, RS256).catch((error) => {
          expect(error).toBeInstanceOf(AlgoNotSupported);
          expect(error.message).toBe("Encoding algo not supported");
        });
      });
    });
  });

  describe("decryptJWS", () => {
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

    const signedJWT = jwt.sign(mockedJWTPayload, privateKeyForSignature);

    const passphrase = "even more top secret";
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
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

    test("should ", async () => {
      const privateKey2 = await jose.JWK.asKey(privateKey, "pkcs8");

      // const { decrypt } = jose2(publicKey2, privateKey2);

      // const JWS2 = await decrypt(JWE);

      // console.log({ JWS2 });

      // const keystore = jose.JWK.createKeyStore();
      // const key = await jose.JWK.createKey("RSA", 2048, {
      //   alg: "RSA-OAEP-256",
      // });
      // const kid = await keystore
      //   .add(key.toPEM())
      //   .then((result: jose.JWK.Key) => result.kid);

      // jose.JWE.createDecrypt(key.toPEM())

      // console.log(keystore.get(kid));

      // const key = await jose.JWK.asKey(rawPrivateKeyForEncryption);
      // const x = key.toPEM(true);
      // console.log(x);

      expect(1).toEqual(1);
      // jose.JWE.createEncrypt(key).update(Buffer.from(signedJWT)).final();

      //     const clearText = "foo";

      //     // const payload =;

      //     // const token = await jose.JWE.createEncrypt(options, key)
      //     //   .update(payload, "utf8")
      //     //   .final();
    });
  });
});
