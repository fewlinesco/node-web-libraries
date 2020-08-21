import jwt from "jsonwebtoken";

import { verifyJWT } from "../verifyJWT";

describe("verifyJWT", () => {
  describe("SH256 signed JWT", () => {
    const mockedJWTPayload = {
      aud: ["connect-account"],
      exp: Date.now(),
      iss: "foo",
      scope: "phone email",
      sub: "2a14bdd2-3628-4912-a76e-fd514b5c27a8",
    };

    const mockedClientSecret = "bar";

    const JWT = jwt.sign(mockedJWTPayload, mockedClientSecret);

    test("it should return the JWT payload if a well formed JWT and a client secret are provided", async () => {
      expect.assertions(2);

      const decoded = await verifyJWT<Record<string, unknown>>(
        JWT,
        "connect-account",
        mockedClientSecret,
      );

      expect(decoded).not.toBe(undefined);
      expect(decoded).toEqual(expect.objectContaining(mockedJWTPayload));
    });

    test("it should throw an error if using the wrong client secret", async () => {
      expect.assertions(1);

      await verifyJWT<Record<string, unknown>>("", JWT).catch((error) =>
        expect(error).toBeInstanceOf(SyntaxError),
      );
    });

    test("it should throw an error if using a mall formed JWT", async () => {
      expect.assertions(1);

      await verifyJWT<Record<string, unknown>>(
        mockedClientSecret,
        "",
      ).catch((error) => expect(error).toBeInstanceOf(SyntaxError));
    });
  });
});
