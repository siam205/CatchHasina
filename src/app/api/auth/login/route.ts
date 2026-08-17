import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/authValidation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await compare(password, user.passwordHash))) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt } });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Login is unavailable until the database is configured." }, { status: 500 });
  }
}
