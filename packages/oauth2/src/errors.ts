class MissingJWKSURI extends Error {}

class InvalidKeyIDRS256 extends Error {}

class MissingKeyIDHS256 extends Error {}

class AlgoNotSupported extends Error {}

class InvalidAudience extends Error {}

class ScopesNotSupported extends Error {}

export {
  MissingJWKSURI,
  InvalidKeyIDRS256,
  MissingKeyIDHS256,
  AlgoNotSupported,
  InvalidAudience,
  ScopesNotSupported,
};
