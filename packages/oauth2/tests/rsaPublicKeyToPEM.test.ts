import { rsaPublicKeyToPEM } from "../src/utils/rsaPublicKeyToPEM";

describe("rsaPublicKeyToPEM", () => {
  test("it should create valid rsa public key modulus and exponent", () => {
    const validKey = {
      e: "AQAB",
      kty: "RSA",
      kid: "d6512f53-9774-4a58-830c-981886c8bb43",
      n:
        "y3M7JqY49JeL/ornP7ZY2QlO76akS36Rj1iKVSIlFH754NnqmtGwMrCVZzCWrc882trbGuDhml2psOmCIBjKBpnghNLBZALGNRelCqfV7Cy+EMrQvQ+UWbogT7xfPoL+VYjCZKTeXosfzMNMZFum/Vnk/vYBKilXZfQH1t4sohU=",
      alg: "RS256",
    };

    const { e, n } = validKey;
    const publicKey = rsaPublicKeyToPEM(n, e);

    const expectedKey = `-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAMtzOyamOPSXi/6K5z+2WNkJTu+mpEt+kY9YilUiJRR++eDZ6prRsDKw
lWcwlq3PPNra2xrg4ZpdqbDpgiAYygaZ4ITSwWQCxjUXpQqn1ewsvhDK0L0PlFm6
IE+8Xz6C/lWIwmSk3l6LH8zDTGRbpv1Z5P72ASopV2X0B9beLKIVAgMBAAE=
-----END RSA PUBLIC KEY-----`;

    expect(publicKey).toMatch(expectedKey);
  });
});
