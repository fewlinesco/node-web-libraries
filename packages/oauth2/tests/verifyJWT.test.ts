import fetch from "jest-fetch-mock";
import { enableFetchMocks } from "jest-fetch-mock";
import jwt, { JsonWebTokenError } from "jsonwebtoken";

import {
  InvalidAudience,
  AlgoNotSupported,
  MissingClientSecret,
  InvalidKeyIDRS256,
  MissingKeyIDHS256,
} from "../src/errors";
import { verifyJWT } from "../src/verifyJWT";

enableFetchMocks();

describe("verifyJWT", () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

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

  describe("HS256 signed JWT", () => {
    const mockedClientSecret = "bar";

    const mockedJWTPayload = {
      aud: ["connect-account"],
      exp: Date.now() + 300,
      iss: "foo",
      scope: "phone email",
      sub: "2a14bdd2-3628-4912-a76e-fd514b5c27a8",
    };

    const JWT = jwt.sign(mockedJWTPayload, mockedClientSecret);

    test("it should return the JWT payload if a well formed JWT and a client secret are provided", async () => {
      expect.assertions(2);

      const verifyJWTProps = {
        accessToken: JWT,
        audience: "connect-account",
        clientSecret: mockedClientSecret,
      };

      const decoded = await verifyJWT<Record<string, unknown>>(verifyJWTProps);

      expect(decoded).not.toBe(undefined);
      expect(decoded).toEqual(expect.objectContaining(mockedJWTPayload));
    });

    test("it should throw an error if using the wrong client secret", async () => {
      expect.assertions(1);

      const verifyJWTProps = {
        accessToken: JWT,
        audience: "connect-account",
        clientSecret: "wrongClientSecret",
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch((error) =>
        expect(error).toBeInstanceOf(JsonWebTokenError),
      );
    });

    test("it should throw an error if missing client secret", async () => {
      expect.assertions(2);

      const verifyJWTProps = {
        accessToken: JWT,
        audience: "connect-account",
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch(
        (error) => {
          expect(error).toBeInstanceOf(MissingClientSecret);
          expect(error.message).toBe(
            "Missing Client Secret for HS256 encoded JWT",
          );
        },
      );
    });

    test("it should throw an error if using a malformed JWT", async () => {
      expect.assertions(1);

      const verifyJWTProps = {
        accessToken: "malformedJWT",
        audience: "connect-account",
        clientSecret: mockedClientSecret,
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch((error) =>
        expect(error).toBeInstanceOf(SyntaxError),
      );
    });

    test("is should throw an error if wrong audience", async () => {
      expect.assertions(2);

      const verifyJWTProps = {
        accessToken: JWT,
        audience: "wrongAudience",
        clientSecret: mockedClientSecret,
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch(
        (error) => {
          expect(error).toBeInstanceOf(InvalidAudience);
          expect(error.message).toBe("Invalid audience");
        },
      );
    });
  });

  describe("RS256 signed JWT", () => {
    const mockedRS256JWT =
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

      fetch.once(JSON.stringify(mockedFetchResponse));

      const verifyJWTProps = {
        accessToken: mockedRS256JWT,
        audience: "connect-account",
        jwksURI: "mockeckJWKSURI",
      };

      const decodedJWT = await verifyJWT<Record<string, unknown>>(
        verifyJWTProps,
      );

      expect(decodedJWT).not.toBe(undefined);
      expect(decodedJWT).toEqual(expect.objectContaining(mockedDecodedJWT));
    });

    test("is should throw an error if wrong audience", async () => {
      expect.assertions(2);

      fetch.once(JSON.stringify(mockedFetchResponse));

      const verifyJWTProps = {
        accessToken: mockedRS256JWT,
        audience: "wrongAudience",
        jwksURI: "mockeckJWKSURI",
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch(
        (error) => {
          expect(error).toBeInstanceOf(InvalidAudience);
          expect(error.message).toBe("Invalid audience");
        },
      );
    });

    test("should throw an error if invalid key id", async () => {
      expect.assertions(2);

      const mockedFetchResponse = {
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

      fetch.once(JSON.stringify(mockedFetchResponse));

      const verifyJWTProps = {
        accessToken: mockedRS256JWT,
        audience: "connect-account",
        jwksURI: "mockeckJWKSURI",
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch(
        (error) => {
          expect(error).toBeInstanceOf(InvalidKeyIDRS256);
          expect(error.message).toBe(
            "Invalid key ID (kid) for RS256 encoded JWT",
          );
        },
      );
    });

    test("should throw an error if missing key id", async () => {
      expect.assertions(2);

      fetch.once(JSON.stringify(mockedFetchResponse));

      const mockedPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXgIBAAKBgQDLczsmpjj0l4v+iuc/tljZCU7vpqRLfpGPWIpVIiUUfvng2eqa
0bAysJVnMJatzzza2tsa4OGaXamw6YIgGMoGmeCE0sFkAsY1F6UKp9XsLL4QytC9
D5RZuiBPvF8+gv5ViMJkpN5eix/Mw0xkW6b9WeT+9gEqKVdl9AfW3iyiFQIDAQAB
AoGBAJya+6o5g1gLm5B5PZ5Wb7fJKYDhxk/ygntUDU+Q8/f98by6IZPA2x95u9dt
mF78SfyxQL1E44QemvN6G1c3nbHtPUA661kaRN/QUr4Dw59csuytSpaYXP6RDjem
U51EIA2ShybKkzRvQE67t4hMPx7q8cfHQ39YzdKXcUFV6qC1AkEA8PqUguzCIrIA
+5OabpMjJcKveu9RPLC7/Kwh7RwOefvty2VpDjRYR/CcgV3jVFnJ23iQ6qfIBTuE
5agQX3A0AwJBANghyVur/psj4PDDcdMe2eTK7kJE39m2JddpYv58UzLaay1nAOh7
g/GMzi9goJqgTXCq8hdUNtukbOLlO/jREgcCQBU1eKytOcjj8cIyk3z35jgEkn03
Yub8hw8N905vEbcavSsRmdVuNfbe7mdUZBWgcWuniNmeOrR7MI8l44sCzRECQQDA
YlK6Jv8bWXSA23gWVP/fiENM+cHIKTrF5CkaHdBxE7sTTvyf9FIeURe3VGuhN8+2
2nNkELJEELhbv3ECqhdBAkEAuHYa4b0ePMj6VvObOJOylfHqPM5NJ19PSxjvq7f8
J9d/f9cP2lDcoNbRxMkVbeJqZE+0SYmeo8FzXUZT+9ryQA==
-----END RSA PRIVATE KEY-----`;

      const missingKidJWT =
        jwt.sign({ audience: "fooBar" }, mockedPrivateKey, {
          algorithm: "RS256",
        }) + "ps8pa863Ic58ig2Tovqh19ShIjuBPv7nEOS3WSY8n74";

      const verifyJWTProps = {
        accessToken: missingKidJWT,
        audience: "fooBar",
        jwksURI: "mockeckJWKSURI",
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch(
        (error) => {
          expect(error).toBeInstanceOf(MissingKeyIDHS256);
          expect(error.message).toBe(
            "Missing key ID (kid) for RS256 encoded JWT",
          );
        },
      );
    });
  });

  test("it should throw an error algo is != from RS256 or HS256", async () => {
    expect.assertions(2);

    fetch.once(JSON.stringify(mockedFetchResponse));

    const noAlgoJWT =
      jwt.sign({ audience: "fooBar" }, "fooBar", {
        algorithm: "none",
      }) + "ps8pa863Ic58ig2Tovqh19ShIjuBPv7nEOS3WSY8n74";

    const verifyJWTProps = {
      accessToken: noAlgoJWT,
      audience: "connect-account",
      jwksURI: "mockeckJWKSURI",
    };

    await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch((error) => {
      expect(error).toBeInstanceOf(AlgoNotSupported);
      expect(error.message).toBe("Encoding algo not supported");
    });
  });
});
