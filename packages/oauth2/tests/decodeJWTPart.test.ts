import jwt from "jsonwebtoken";

import { decodeJWTPart } from "../src/utils/decodeJWTPart";

describe("decodeJWTPart", () => {
  const mockedClientSecret = "bar";

  const mockedJWTPayload = {
    aud: ["connect-account"],
    exp: Date.now() + 300,
    iss: "foo",
    scope: "phone email",
    sub: "2a14bdd2-3628-4912-a76e-fd514b5c27a8",
  };

  const JWT = jwt.sign(mockedJWTPayload, mockedClientSecret);

  test("should should decode parts of a JWT", () => {
    expect.assertions(1);

    const [, payload] = JWT.split(".");

    const decodedPayload = decodeJWTPart(payload);

    expect(decodedPayload).toEqual(expect.objectContaining(mockedJWTPayload));
  });
});
