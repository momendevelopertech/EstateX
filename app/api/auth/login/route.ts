import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 422 });
    }

    const rows = (await sql`SELECT * FROM users WHERE email = ${email}`) as any[];
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSession(user.email, user.name, user.role);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, user: { email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("Login failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}