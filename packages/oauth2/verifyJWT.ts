import jwt from "jsonwebtoken";

export function verifyJWT<T>(
  clientSecret: string,
  accessToken: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      accessToken,
      clientSecret,
      (error: jwt.VerifyErrors | null, decoded: unknown) => {
        return error ? reject(error) : resolve(decoded as T);
      },
    );
  });
}
