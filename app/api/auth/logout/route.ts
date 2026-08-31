import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await getSession(); // no-op; we clear regardless
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}