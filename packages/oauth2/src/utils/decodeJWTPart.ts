export function decodeJWTPart<T = unknown>(JWTPart: string): T {
  const base64 = JWTPart.replace(/-/g, "+").replace(/_/g, "/");
  const buff = Buffer.from(base64, "base64");
  const decoded = buff.toString("ascii");

  const jsonPayload = decodeURIComponent(
    decoded
      .split("")
      .map((c) => {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );

  return JSON.parse(jsonPayload) as T;
}
