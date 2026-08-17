import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ scores: [] });

  const scores = await prisma.bestScore.findMany({ where: { userId }, orderBy: { level: "asc" } });
  return NextResponse.json({ scores });
}
