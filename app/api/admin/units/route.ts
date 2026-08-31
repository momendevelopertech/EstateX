import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const units = (await sql`
    SELECT u.id, u.unit_number, u.area, u.price, u.status, u.status_version, u.image_url,
           f.number AS floor_number, b.name AS building_name, p.name AS project_name,
           ut.name AS type_name,
           (SELECT count(*)::int FROM leads l WHERE l.unit_id = u.id AND l.status = 'new') AS new_leads
    FROM units u
    JOIN floors f ON f.id = u.floor_id
    JOIN buildings b ON b.id = f.building_id
    JOIN projects p ON p.id = b.project_id
    LEFT JOIN unit_types ut ON ut.id = u.unit_type_id
    ORDER BY p.name, b.name, f.number, u.unit_number
    LIMIT 300
  `) as any[];

  const leads = (await sql`
    SELECT l.id, l.name, l.phone, l.email, l.message, l.source, l.status,
           l.created_at, u.unit_number, p.name AS project_name
    FROM leads l
    LEFT JOIN units u ON u.id = l.unit_id
    JOIN projects p ON p.id = l.project_id
    ORDER BY l.created_at DESC LIMIT 50
  `) as any[];

  const counts = (await sql`
    SELECT
      (SELECT count(*)::int FROM units) AS units,
      (SELECT count(*)::int FROM units WHERE status = 'available') AS available,
      (SELECT count(*)::int FROM units WHERE status = 'reserved') AS reserved,
      (SELECT count(*)::int FROM units WHERE status = 'sold') AS sold,
      (SELECT count(*)::int FROM leads) AS leads,
      (SELECT count(*)::int FROM leads WHERE status = 'new') AS new_leads
  `) as any[];

  return NextResponse.json({ units, leads, counts: counts[0] });
}

// PATCH: update unit fields (price) — only if session is valid
export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const id = String(body.id ?? "");
  const set: string[] = [];
  const values: any[] = [];

  if (body.price !== undefined) {
    values.push(Number(body.price));
    set.push(`price = $${values.length}`);
  }
  if (body.image_url !== undefined) {
    values.push(String(body.image_url));
    set.push(`image_url = $${values.length}`);
  }
  if (set.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
  }

  values.push(id);
  const rows = (await sql(`UPDATE units SET ${set.join(", ")} WHERE id = $${values.length} RETURNING id`, ...values)) as any[];
  if (rows.length === 0) return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// POST: create a new unit (admin). Body: floor_id, unit_number, unit_type_id, area, price
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { floor_id, unit_number, unit_type_id, area, price } = body;
  if (!floor_id || !unit_number || !area || !price) {
    return NextResponse.json({ error: "floor_id, unit_number, area, price are required" }, { status: 422 });
  }

  try {
    const rows = (await sql`
      INSERT INTO units (floor_id, unit_type_id, unit_number, area, price, status, status_version)
      VALUES (${floor_id}, ${unit_type_id || null}, ${unit_number}, ${Number(area)}, ${Number(price)}, 'available', 0)
      RETURNING id
    `) as any[];
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err: any) {
    if (String(err?.message ?? "").includes("duplicate key")) {
      return NextResponse.json({ error: "Unit number already exists on this floor" }, { status: 409 });
    }
    throw err;
  }
}