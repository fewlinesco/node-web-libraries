import fetch from "jest-fetch-mock";
import { enableFetchMocks } from "jest-fetch-mock";
import jwt, { JsonWebTokenError } from "jsonwebtoken";

import { verifyJWT } from "../verifyJWT";

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

  describe("SH256 signed JWT", () => {
    const mockedClientSecret = "bar";

    const mockedJWTPayload = {
      aud: ["connect-account"],
      exp: Date.now(),
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
      const verifyJWTProps = {
        accessToken: JWT,
        audience: "wrongAudience",
        clientSecret: mockedClientSecret,
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch((error) =>
        expect(error.message).toBe("Invalid audience"),
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
      expect.assertions(1);

      fetch.once(JSON.stringify(mockedFetchResponse));

      const verifyJWTProps = {
        accessToken: mockedRS256JWT,
        audience: "wrongAudience",
        jwksURI: "mockeckJWKSURI",
      };

      await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch((error) =>
        expect(error.message).toBe("Invalid audience"),
      );
    });
  });

  test("it should throw an error algo is != from RS256 or HS256", async () => {
    expect.assertions(1);

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

    await verifyJWT<Record<string, unknown>>(verifyJWTProps).catch((error) =>
      expect(error.message).toBe("Encoding algo not supported"),
    );
  });
});
