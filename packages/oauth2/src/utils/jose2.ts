import jose from "node-jose";

type Jose2Output = {
  encrypt: (raw: string) => Promise<string>;
  decrypt: (encrypted: string) => Promise<jose.JWE.DecryptResult>;
};

export const jose2 = (
  publicKey: jose.JWK.Key | jose.JWK.Key[],
  privateKey: jose.JWK.Key | jose.JWK.KeyStore,
): Jose2Output => {
  async function encrypt(raw: string): Promise<string> {
    if (!raw) throw new Error("Missing raw data.");

    const buffer = Buffer.from(JSON.stringify(raw));

    return jose.JWE.createEncrypt(publicKey).update(buffer).final();
  }

  async function decrypt(encrypted: string): Promise<jose.JWE.DecryptResult> {
    if (!encrypted) throw new Error("Missing encrypted data.");

    return jose.JWE.createDecrypt(privateKey).decrypt(encrypted);
  }

  return { encrypt, decrypt };
};
