# FWL OAuth2

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.
It mainly provides an abstraction for the OAuth2 flow, and a secure way to verify JWT for HS256 and RS256 algorithms

## Installation

```shell
yarn add @fwl/oauth2
```

## Getting Started

You first need to initialize the client instance, called `OAuth2Client`. This class takes the following constructor parameters:

- `openIDConfigurationURL`: The URL to retrieve the OpenID configuration.
- `clientID`: Client ID of the online service (e.g. internet website, application) that uses the Provider Authentication and Authorization service for its User.
- `clientSecret`: Paired with the client ID, used to authenticate the Application from which the User intent to sign in.
- `redirectURI`: URI used to redirect to the original Application website after a successful login in on Connect.
- `audience`: The audience of the Application (its name for Connect)..
- `scopes`: It represents the kind of information and actions that an Application is able to access on another Application. Every scope has to be authorized by the User during sign in operation.

```typescript
import OAuth2Client, { OAuth2ClientConstructor } from "@fwl/oauth2";

const oauthClientConstructorProps: OAuth2ClientConstructor = {
  openIDConfigurationURL: "***",
  clientID: "***",
  clientSecret: "***",
  redirectURI: "***",
  audience: "***",
  scopes: ["***", "***"],
};

const oauthClient = new OAuth2Client(oauthClientConstructorProps);
```

## Usage

The initialized instance of `OAuth2Client` provides the following methods to help with the OAuth2 flow. Each method will initialize the open OpenID configuration returned from the URL provided if not initialized yet.

### getAuthorizationURL

```typescript
async getAuthorizationURL(state?: string): Promise<URL>{}
```

The OAuth2 flow requires to move out of your application. If you need to keep some sort of state (like a user ID), you can pass said state to the function, which will be be added at the end of the query string. The function returns the authorization URL used to start the OAuth2 flow, and retrieve the `authorization_code`.

```typescript
const authURL = await oauthClient.getAuthorizationURL("state");
```

### getTokensFromAuthorizationCode

```typescript
async getTokensFromAuthorizationCode(authorizationCode: string): Promise<string[]>{};
```

Returns a list containing the `access_token`, `refresh_token`, and `id_token` if present.

```typescript
const tokens = await oauthClient.getTokensFromAuthorizationCode(
  "authorization_code",
);
```

### verifyJWT

```typescript
async verifyJWT<T = unknown>(accessToken: string, algo: string): Promise<T> {};
```

Used to verify the JWS (i.e. `access_token`). It provides a series of checks, like audiences, algorithm or public key.

```typescript
const decoded = await oauthClient.verifyJWT(JWS, "RS256");
```

### decryptJWE

```typescript
async decryptJWE<T = unknown>(JWE: string, privateKey: string, isSigned: boolean): Promise<T> {}
```

Used to decrypt the JWE (i.e. `access_token`), and returns the JWS or the JWT.

The `privateKey` argument should be in PEM format.

```typescript
// Signed JWE
const decrypted = oauthClient.decryptJWE<string>(JWE, privateKey, true);

// Un-signed JWE
const decrypted = oauthClient.decryptJWE<{ [key: string]: string }>(
  JWE,
  privateKey,
  false,
);
```

## Utils

`@fwl/oauth2` also provides utils functions and default objects that we are using in the package flow.

### generateHS256JWS

```typescript
import { generateHS256JWS } from "@fwl/oauth2"

generateHS256JWS(customPayload?: CustomPayload, secret?: string): string {};
```

If used without any argument, the function will return a default **HS256 JWS** composed of the default objects found below.

You can give a custom **secret** for signature, and/or a custom payload to customize your **HS256 JWS**.

### generateRS256JWS

```typescript
import { generateRS256JWS } from "@fwl/oauth2"

generateRS256JWS(customPayload?: CustomPayload, secret?: string): string {};
```

If used without any argument, the function will return a default **RS256 JWS** composed of the default objects found below.

You can give a custom **secret** for signature, and/or a custom payload to customize your **RS256 JWS**.

### default JWS composition objects

The following exported objects are used when generating a **JWS** using `generateHS256JWS` and `generateHS256JWS`, while no arguments are passed:

```typescript
const defaultPayload: JWTPayload = {
  aud: ["oauth2"],
  exp: Date.now() + 3600,
  iss: "https://fwl.test",
  scope: "email",
  sub: "2a14bdd2-3628-4912-a76e-fd514b5c27a8",
};
```

```typescript
const defaultAsymmetricAlgoKeyPair = {
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
```

```typescript
const defaultSecret = "c9ab0fdc-b2dc-47ad-933b-87cf1b180ab5";
```

They are all imported like so:

```typescript
import {
  defaultAsymmetricAlgoKeyPair,
  defaultPayload,
  defaultSecret,
} from "@fwl/oauth2";
```

### decodeJWTPart

Takes a part from a JWT (e.g. the JWA, or the payload), and decode it.

```typescript
import { decodeJWTPart } from "@fwl/oauth2";

const [JWA, payload] = JWT.split(".");

const decodedJWA = decodeJWTPart(JWA);
const decodedPayload = decodeJWTPart(payload);
```

### rsaPublicKeyToPEM

Takes a modulus and an exponent (found in the `JWKS`), and recreate a public key.

```typescript
import { rsaPublicKeyToPEM } from "@fwl/oauth2";

const key = {
  e: "AQAB",
  kty: "RSA",
  kid: "d6512f53-9774-4a58-830c-981886c8bb43",
  n:
    "y3M7JqY49JeL/ornP7ZY2QlO76akS36Rj1iKVSIlFH754NnqmtGwMrCVZzCWrc882trbGuDhml2psOmCIBjKBpnghNLBZALGNRelCqfV7Cy+EMrQvQ+UWbogT7xfPoL+VYjCZKTeXosfzMNMZFum/Vnk/vYBKilXZfQH1t4sohU=",
  alg: "RS256",
};

const { e, n } = key;
const publicKey = rsaPublicKeyToPEM(n, e);
```
