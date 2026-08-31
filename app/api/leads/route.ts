import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();
    const source = String(body.source ?? "web");
    const project_id = String(body.project_id ?? "");
    const unit_id = body.unit_id ? String(body.unit_id) : null;

    if (!name || !phone || !project_id) {
      return NextResponse.json({ error: "Name, phone and project are required" }, { status: 422 });
    }

    const rows = (await sql`
      INSERT INTO leads (project_id, unit_id, name, phone, email, message, source, status)
      VALUES (${project_id}, ${unit_id}, ${name}, ${phone}, ${email || null}, ${message || null}, ${source}, 'new')
      RETURNING id
    `) as any[];

    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("Lead creation failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}