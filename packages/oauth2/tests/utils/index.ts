import { JWTPayload } from "@src/types";

export { generateJWS } from "./generateJWS";

const defaultPayload: JWTPayload = {
  aud: ["oauth2"],
  exp: Date.now() + 3600,
  iss: "fwl",
  scope: "phone email",
  sub: "2a14bdd2-3628-4912-a76e-fd514b5c27a8",
};

const asymmetricAlgoKeyPair = {
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAsBUV0XnPsTCYhI3TmcxjSmnOmlQlKWfFbr/sABcM65P6f28g
c39XyWj/CcE+iIscrfvodinyHr2dXm+wpTnVyqZUsOavEHhq0n8flp8G4RdsYDMn
MIH6gat4XVTLztLiM0Vsb+h5LAD1ETxiVNtoB3urtD9Wn6F1NobDWc1FKtrGGCyt
HC0S7GNVAUE+sZTxPTXOraCV8aZt5McPnZE7V2ohSoJJR4HxUV16xIlOkxDKrvt1
INTjE4G3va0kF+NO37as696KLnylS/Zk13zS0+GKU+swjJHMHGTwy8p4ZRdW+94k
Q8jQjkc3QNswv7GDqy+om5S36qz2UfEudDg8vwIDAQABAoIBAQCblcX1liCCfGIH
nhn+p66ELgG0M+2yLFMzjLnHSpbMAbExsMuHwlmbSf8wa2QJ2oG46gF5h468wuau
bxoypGvX6CilNvAxKXWaEWGkAVhexAeq6QgTwIXM1epA7ZA4a/YbP5iVOWD4FNB2
LljkigndstUBK4Yq/stHJsSuMMaRGc6p7SwGe/qbJLFE2gU13umQr0eGJGcunoaa
/NI8pI+XUqNBJ5o0gHwPVW39dCtN2PCfV+pnh4d/0FcGKJMNbZLutgmwyo+dB2+R
2iJPxjam/fZ0eaoGd0b9IaVCgrLb4er+9NW6P7C3SmUGk0FynsG0p7SZdyIFhT1M
2RLjX+1BAoGBAN2yQqkSr3Tv9dkf/R237RowAgTCAsuvwwztQSCgaOQUVxzaiCaN
boJHRCSjz3LF6e2678T6TUnJyeTPnYGBt7/5Abxhu3kpxMZdn433YszdBoFucs0Z
Vs/BPX0T5EP18FEE5QpHewFBEn7hCD/ITc/ESuFpzczBujtTt4XHgSrZAoGBAMtT
++uVK6IFjikiIZ6mfasFql8bgLsN20rJEmdVnUdrGWhClt1ofcc1c58BXTZ9XTFW
HUr4NXJjRWIeG7CQr4JBpbZrhrWrMTpmj1YmmjLAJBht3EUa6iY6ZugSwX0Hs8BX
jz8o5Q8W55ovTMvXSyOpmO3hUc4M7Gw5B3UXOfVXAoGBAMr/FAzOYDx6EKo8oT9a
D9Afz2ld4MNzb+1hPXZLi1/0xANWkr6CWIMQEHRgTm6wjE+zESNTcfuzups6A+X2
yjMNJarB7rC2L0jXp2aN9DjT1cYkRRhKMHRRZCUoVqZoByGYksTDyPzQAciN80i7
94vcGBipEdmANi9mq6/iiwKZAoGBAJDzmXfUS1vhO/ylAXS52oMOsevFjptLgJcr
Czyxs0NT3bQPLMBBGtHmkDu93DbZXpOqgY2Nr4SRssgFENZp/0UMCdgnhcyDc7/f
l7XiJTGi+tiTkWGOk3iXT/+IR3ocAJBRm6R6Qfnk6U1pBQWYwU92O7jyVcBgRDfO
3DskSMRXAoGAYMK81hY9A+XF6Y77/cz5fYn75/T29+7bgHCNdN5Ky91EH6KWsBpx
ayXuC8YrChmmGRB09QhOtS1P0HYYzfXFaEdBVltjuBRXYQqLAlolx4vchpTYBpsu
EvQSc3gTNTqK91gATPZ+5uN7+cdbiMfc5hGKTeiMm6F9m95phyPMS1c=
-----END RSA PRIVATE KEY-----`,
  publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsBUV0XnPsTCYhI3Tmcxj
SmnOmlQlKWfFbr/sABcM65P6f28gc39XyWj/CcE+iIscrfvodinyHr2dXm+wpTnV
yqZUsOavEHhq0n8flp8G4RdsYDMnMIH6gat4XVTLztLiM0Vsb+h5LAD1ETxiVNto
B3urtD9Wn6F1NobDWc1FKtrGGCytHC0S7GNVAUE+sZTxPTXOraCV8aZt5McPnZE7
V2ohSoJJR4HxUV16xIlOkxDKrvt1INTjE4G3va0kF+NO37as696KLnylS/Zk13zS
0+GKU+swjJHMHGTwy8p4ZRdW+94kQ8jQjkc3QNswv7GDqy+om5S36qz2UfEudDg8
vwIDAQAB
-----END PUBLIC KEY-----`,
};

const defaultSecret = "c9ab0fdc-b2dc-47ad-933b-87cf1b180ab5";

export { defaultPayload, asymmetricAlgoKeyPair, defaultSecret };
