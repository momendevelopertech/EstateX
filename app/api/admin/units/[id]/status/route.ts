import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ALLOWED = ["available", "reserved", "sold", "hidden"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const status = String(body.status ?? "");
  const expectedVersion = Number(body.expected_version);

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 422 });
  }

  // Concurrency-safe transition (FR-42 / architecture §3):
  // the unit can only move forward if the caller's last-read version is still current.
  const updated = (await sql`
    UPDATE units SET status = ${status}, status_version = status_version + 1
    WHERE id = ${id} AND status_version = ${expectedVersion}
    RETURNING id, status, status_version
  `) as any[];

  if (updated.length === 0) {
    const current = (await sql`
      SELECT id, unit_number, status, status_version, hold_expires_at
      FROM units WHERE id = ${id}
    `) as any[];
    const u = current[0];
    if (!u) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    // 409 Conflict — the client must refresh its state.
    return NextResponse.json(
      {
        error: "UNIT_STATUS_CONFLICT",
        message: "This unit's status has changed since you last viewed it.",
        current: {
          unitId: u.id,
          unitNumber: u.unit_number,
          status: u.status,
          statusVersion: u.status_version,
          holdExpiresAt: u.hold_expires_at ?? null,
        },
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, ...updated[0] });
}