import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ user: await getCurrentUser() });
  } catch (error) {
    console.error("Session lookup failed", error);
    return NextResponse.json({ user: null });
  }
}
