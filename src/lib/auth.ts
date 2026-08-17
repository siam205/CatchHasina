import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE_NAME = "neon_maze_session";
const SESSION_DURATION = "7d";

function sessionSecret() {
  const configuredSecret = process.env.SESSION_SECRET;
  if (configuredSecret) return new TextEncoder().encode(configuredSecret);
  if (process.env.NODE_ENV !== "production") return new TextEncoder().encode("local-development-secret-change-me");
  throw new Error("SESSION_SECRET is required in production.");
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(sessionSecret());

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSessionUserId() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
