import { jwtVerify } from "jose";

/** JWT check with no database or Next.js imports, so the proxy can use it. */
export async function verifyJwt(token: string): Promise<{ userId: number; email: string; iat: number } | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32 || !token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (typeof payload.userId !== "number" || typeof payload.email !== "string" || typeof payload.iat !== "number") return null;
    return { userId: payload.userId, email: payload.email, iat: payload.iat };
  } catch {
    return null;
  }
}
