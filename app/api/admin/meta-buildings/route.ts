import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buildings = (await sql`
    SELECT b.id, b.name,
      (SELECT json_agg(f ORDER BY f.number)
        FROM (SELECT fl.id, fl.number FROM floors fl WHERE fl.building_id = b.id) f) AS floors
    FROM buildings b
    ORDER BY b.name
  `) as any[];

  const types = (await sql`SELECT id, name FROM unit_types ORDER BY base_area`) as any[];

  return NextResponse.json({ buildings, types });
}