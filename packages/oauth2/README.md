# FWL OAuth2

**Disclaimer**: this package is made for our internal usage and is only open source for convenience so we might not consider Pull Requests or Issues. Feel free to fork though.

This is part of the Fewlines Web Libraries packages.
It mainly provides an abstraction for the OAuth2 flow, and a secure way to verify JWT, regardless of its algorithm used.

## Installation

```shell
yarn add @fwl/oauth2
```

## Getting Started

You first need to initialize the client instance, called `OAuth2Client`. This class takes the following constructor parameters:

- `openIDConfigurationURL`: The URL to retrieve the OpenID configuration.
- `clientID`/`clientSecret`: A unique pair of credentials that authenticate the Application from which the User intents to sign in.
- redirectURI: URI used to redirect to the original Application website after a successful login in on Connect.
- audience: The name of the Application.
- scopes: It represents the kind of information and actions that an Application is able to access on another Application. Every scope has to be authorized by the User during sign in operation.

```typescript
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

Return the authorization URL used to start the OAuth2 flow, and retrieve the `authorization_code`.

```typescript
const authURL = await oauthClient.getAuthorizationURL();
```

### getTokensFromAuthorizationCode

```typescript
async getTokensFromAuthorizationCode(authorizationCode: string,): Promise<string[]>{};
```

Returns a list containing the `access_token`, `refresh_token`, and `id_token` if present.

```typescript
const tokens = await oauthClient.getTokensFromAuthorizationCode(
  "authorization_code"
);
```

### verifyJWT

```typescript
async verifyJWT<T = unknown>(accessToken: string, algo: string): Promise<T> {};
```

Used to verify the JWT (i.e. `access_token`). It provides a series of checks, like audiences, algorithm or public key.

```typescript
const decoded = await oauthClient.verifyJWT(JWT, "RS256");
```

## Utils

`@fwl/oauth2` also provides utils functions that we are using in the package flow.

### decodeJWTPart

Takes a part from a JWT (e.g. the header, or the payload), and decode it.

```typescript
const [header, payload] = JWT.split(".");

const decodedHeader = decodeJWTPart(header);
const decodedPayload = decodeJWTPart(payload);
```

### rsaPublicKeyToPEM

Takes a modulus and an exponent (found in the `JWKS`), and recreate a public key.

```typescript
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
