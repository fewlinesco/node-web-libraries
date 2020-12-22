import { decodeJWTPart } from "../src/utils/decodeJWTPart";
import { defaultPayload } from "../src/utils/defaultObjects";
import { generateRS256JWS } from "../src/utils/generateJWS";

describe("decodeJWTPart", () => {
  const JWS = generateRS256JWS();

  test("should should decode parts of a JWT", () => {
    expect.assertions(1);

    const [, payload] = JWS.split(".");

    const decodedPayload = decodeJWTPart(payload);

    expect(decodedPayload).toEqual(expect.objectContaining(defaultPayload));
  });
});
