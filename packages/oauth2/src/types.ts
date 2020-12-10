export type OpenIDConfiguration = {
  userinfo_signing_alg_values_supported: string[];
  userinfo_endpoint: string;
  token_endpoint_auth_signing_alg_values_supported: ("HS256" | "RS256")[];
  token_endpoint_auth_methods_supported: string[];
  token_endpoint: string;
  subject_types_supported: string;
  scopes_supported: string[];
  response_types_supported: string[];
  request_uri: boolean;
  request_parameter_supported: boolean;
  jwks_uri: string;
  issuer: string;
  id_token_signing_alg_values_supported: ("HS256" | "RS256")[];
  grant_types_supported: string[];
  claims_supported: string[];
  claim_types_supported: string[];
  authorization_endpoint: string;
};

export type OAuth2ClientConstructor = {
  openIDConfigurationURL: string;
  clientID: string;
  clientSecret: string;
  redirectURI: string;
  audience: string;
  scopes: string[];
  fetch?: any;
};

export type JWKSDT = {
  keys: {
    use: string;
    n: string;
    kty: string;
    kid: string;
    e: string;
    alg: string;
  }[];
};

export type OAuth2Tokens = {
  refresh_token: string;
  access_token: string;
  id_token?: string;
};

export type JWTPayload = {
  aud: string | string[];
  exp: number;
  iss: string;
  scope: string;
  sub: string;
};

export type CustomPayload = Record<string, unknown>;
