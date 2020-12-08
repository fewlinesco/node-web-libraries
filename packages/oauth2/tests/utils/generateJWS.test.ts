import { defaultPayload, generateJWS } from "@tests/utils";
import { decodeJWTPart } from "index";

describe("generateJWS", () => {
  test("should generate a JWS when only passing the algo", () => {
    expect.assertions(4);

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

  test("should generate a JWS when passing a custom payload", () => {
    // expect.assertions(1);
    // const HS256JWS = generateJWS("HS256");
    // expect(HS256JWS.split(".").length).toEqual(3);
    // const [, HS256Payload] = HS256JWS.split(".");
    // const decodedHS256Payload = decodeJWTPart(HS256Payload);
    // expect(decodedHS256Payload).toEqual(
    //   expect.objectContaining(defaultPayload),
    // );
    // const RS256JWS = generateJWS("RS256");
    // expect(RS256JWS.split(".").length).toEqual(3);
    // const [, RS256Payload] = RS256JWS.split(".");
    // const decodedRS256Payload = decodeJWTPart(RS256Payload);
    // expect(decodedRS256Payload).toEqual(
    //   expect.objectContaining(defaultPayload),
    // );
  });

  test("should generate a JWS when passing a custom secretOrPrivateKey", () => {
    // expect.assertions(1);
    // const HS256JWS = generateJWS("HS256");
    // expect(HS256JWS.split(".").length).toEqual(3);
    // const [, HS256Payload] = HS256JWS.split(".");
    // const decodedHS256Payload = decodeJWTPart(HS256Payload);
    // expect(decodedHS256Payload).toEqual(
    //   expect.objectContaining(defaultPayload),
    // );
    // const RS256JWS = generateJWS("RS256");
    // expect(RS256JWS.split(".").length).toEqual(3);
    // const [, RS256Payload] = RS256JWS.split(".");
    // const decodedRS256Payload = decodeJWTPart(RS256Payload);
    // expect(decodedRS256Payload).toEqual(
    //   expect.objectContaining(defaultPayload),
    // );
  });
});
