import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { normalizeEmail, validateCredentials } from "@/lib/authValidation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: unknown; email?: unknown; password?: unknown };
    const validationError = validateCredentials(body);
    if (validationError || typeof body.username !== "string") {
      return NextResponse.json({ error: validationError ?? "Username is required." }, { status: 400 });
    }

    const username = body.username.trim();
    const email = normalizeEmail(body.email);
    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existing) return NextResponse.json({ error: "That username or email is already registered." }, { status: 409 });

    const user = await prisma.user.create({
      data: { username, email, passwordHash: await hash(body.password as string, 12) },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json({ error: "Account creation is unavailable until the database is configured." }, { status: 500 });
  }
}
