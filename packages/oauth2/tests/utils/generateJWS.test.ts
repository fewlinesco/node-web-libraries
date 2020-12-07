import { decodeJWTPart } from "index";

import { defaultPayload, generateJWS } from ".";

describe("generateJWS", () => {
  test("should generate a JWS when only passing the algo", () => {
    expect.assertions(1);

    const HS256JWS = generateJWS("HS256");
    expect(HS256JWS.split(".").length).toEqual(3);

    const [, HS256Payload] = HS256JWS.split(".");
    const decodedHS256Payload = decodeJWTPart(HS256Payload);
    expect(decodedHS256Payload).toEqual(
      expect.objectContaining(defaultPayload),
    );

    const RS256JWS = generateJWS("RS256");
    expect(RS256JWS.split(".").length).toEqual(3);

    const [, RS256Payload] = RS256JWS.split(".");
    const decodedRS256Payload = decodeJWTPart(RS256Payload);
    expect(decodedRS256Payload).toEqual(
      expect.objectContaining(defaultPayload),
    );
  });
});
