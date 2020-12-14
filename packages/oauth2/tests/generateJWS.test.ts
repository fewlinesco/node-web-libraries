import { decodeJWTPart } from "../src/utils/decodeJWTPart";
import { defaultPayload } from "../src/utils/defaultObjects";
import { generateHS256JWS, generateRS256JWS } from "../src/utils/generateJWS";

describe("generateJWS", () => {
  const exp = Date.now() - 3600;

  const customPayload = {
    exp,
    scope: "profile",
  };

  describe("HS256", () => {
    test("should generate an HS256 signed JWS if no arguments are provided", () => {
      expect.assertions(3);

      const HS256JWS = generateHS256JWS();
      expect(HS256JWS.split(".").length).toEqual(3);

      const [JWA, payload] = HS256JWS.split(".");

      const decodedPayload = decodeJWTPart(payload);
      expect(decodedPayload).toEqual(expect.objectContaining(defaultPayload));

      const decodedJWA = decodeJWTPart(JWA);
      expect(decodedJWA).toEqual(
        expect.objectContaining({ alg: "HS256", typ: "JWT" }),
      );
    });

    test("should generate an HS256 signed JWS when passing a custom payload and custom secret", () => {
      expect.assertions(2);

      const customSecret = "1e5e7658-49de-4581-b8ee-fa14202d0e2a";

      const HS256JWS = generateHS256JWS(
        { ...defaultPayload, ...customPayload },
        customSecret,
      );

      const [JWA, payload] = HS256JWS.split(".");

      const decodedPayload = decodeJWTPart(payload);
      expect(decodedPayload).toEqual(
        expect.objectContaining({ ...defaultPayload, ...customPayload }),
      );

      const decodedJWA = decodeJWTPart(JWA);
      expect(decodedJWA).toEqual(
        expect.objectContaining({ alg: "HS256", typ: "JWT" }),
      );
    });
  });

  describe("generateRS256JWS", () => {
    test("should generate an RS256 signed JWS if no arguments are provided", () => {
      expect.assertions(3);

      const RS256JWS = generateRS256JWS();
      expect(RS256JWS.split(".").length).toEqual(3);

      const [JWA, payload] = RS256JWS.split(".");

      const decodedPayload = decodeJWTPart(payload);
      expect(decodedPayload).toEqual(expect.objectContaining(defaultPayload));

      const decodedJWA = decodeJWTPart(JWA);
      expect(decodedJWA).toEqual(
        expect.objectContaining({ alg: "RS256", typ: "JWT" }),
      );
    });

    test("should generate an RS256 signed JWS when passing a custom payload and custom privateKey", () => {
      expect.assertions(2);

      const customPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAxjZtuBv6NLuYOME+R35ZAnRlqeUwgsseNeUE91MRn0cl2auy
5g6GtmTCW5jgDWs0gqqa61p2w+yj5ecNRdkxK8r5qij7PBEeZZ73F6+Kni2i9b6X
x1HSdgdq9jSsTt6OqKanoANl3x4wfvFD/f2Knfl5c0Q+Iq5iC7rHUV5fM0TUsLdM
FyujcD93WSBFeD2GlCLIWW6Hxp6LwzliD8YdLcAOccmI+4GP7zXr4KURZ9jzYW2L
wQQspjHswVbipE8YlIpsubsmB/TGLlqnCX3MF4+cNgx9JoKBTTGvzu5uNE9wrI+7
43k27eKMrL0sLYwJv+LhP0lz1+kG078wskS0hwIDAQABAoIBAC0BtN4mNCT/J6xT
bLHNJabiCSePq/k259AzBXKnQQwamqSXURLd34bQ0DT+PHmviwfUd0LTkr4gIIMW
eLQQghLAjvotPgbAmFdYxiBxspcCI8uLEGmo0ZINUyM+iJWMAXaYCN3Th7Em6Loa
TGcCyBPgzsv2helYEVk6ewGl3RYFtxheKlzq5xBtoNeInfm05IpFseEBZsofMYfJ
+I7vfMERVY/KeqZMtdM+j6o+0TKt5vFcKPBDZAhNbE0JpRbOf61jBL3d64oYoCuV
5DfM0SSc/wLaDEjPUCGw5I59LbJayfFyRyfVUmvkxgYbFb5dJORZdwWQLjiaX9n/
T5uY+FECgYEA/AKTcgHkVWraSTX8SCcbFo9fdNeVvxIlf9Mh1ldi/jnel8X67Lw3
IT7+HUKW+1tCE4c2TYxANF870ZQ7U1KwtnLbqUD48A/+uzY4gbGhoyU4JRDZK/u7
Ha7MxjUg7Z6UNpANv1vtQ9+WEXtk2S1eMCxD016n07887+PwgRaSDt8CgYEAyVnO
RVficWthehYcItk/gbNaigvc4cLNqF3Jranmv1zIsokxkoxoAJ+X1ixD32uvxhyr
dlmTFzJPS0kUtfdt//AgKhuOzQMN5iah5lnAclhWMucunkYn7ydDEdUW3tlU1ClW
ZoiJR1AqjtunfuU5RLWXZHXdepR9fuOSuPxIl1kCgYEAq4cZUq0E/DqpbtFG8Nll
L5rQjxe5vf6c9X8AdgKux3keD9Hac827/G4CymmrmFRKCj6q8Gd4v+zeK00ogBM1
YkmVR4OIrOVGLai/F0+PRBsuNtRb7Pr/Jjn2+SXqTrH0EZtFMC1itiL14tpJDyU5
CbLnS3QO6SouUN2lskdpjKMCgYAPRPo5lAKeK1CHG6oikmsYgOt60I99p3JFNGeY
/et706N8tp7FyFQSyAeRvGWhSd9YnM/796sJ9UzCHtatPghfgmxOBSz9KyAgtglN
GL1Zbo2K6rFEW3mnz0hsz8YePEkMld3xhKU0fUXc85duLh/7r/G9MpsLMruZpdR4
ptkycQKBgFNjDJu+aAt+1OnlZcne6pvTbkXyYAoPcCbgj8oS4SV6gB7fYP5/POAn
V6JGeHdSp+rHxMpmDMBTph+/gcLbxp2hQr/pjo8sidoewkp3sT5CoHNS/dvYEFon
DuPT/XKDVlCokjlGegyaAEKQJuitiDuLFYHw33bnl2qyADl2/Z9c
-----END RSA PRIVATE KEY-----`;

      const RS256JWS = generateRS256JWS(
        { ...defaultPayload, ...customPayload },
        customPrivateKey,
      );

      const [JWA, payload] = RS256JWS.split(".");

      const decodedPayload = decodeJWTPart(payload);
      expect(decodedPayload).toEqual(
        expect.objectContaining({ ...defaultPayload, ...customPayload }),
      );

      const decodedJWA = decodeJWTPart(JWA);
      expect(decodedJWA).toEqual(
        expect.objectContaining({ alg: "RS256", typ: "JWT" }),
      );
    });
  });
});
